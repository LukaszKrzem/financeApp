import base64
import binascii
import hashlib
import logging
import os
import time
import uuid
from datetime import datetime, timedelta, timezone

import back.structure as structure
import jwt
import requests
import sqlalchemy.orm
from back.database import get_db
from back.dependencies import get_current_user
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/banking", tags=["Banking"])

APP_ID = os.getenv("ENABLE_BANKING_APP_ID")
_b64 = os.getenv("ENABLE_BANKING_PRIVATE_KEY_B64")
try:
    PRIVATE_KEY = base64.b64decode(_b64).decode("utf-8") if _b64 else None
except (binascii.Error, ValueError) as exc:
    logger.error("Failed to decode ENABLE_BANKING_PRIVATE_KEY_B64: %s", exc)
    PRIVATE_KEY = None

REQUEST_TIMEOUT = 10
MAX_PAGES = 50


class SyncRequest(BaseModel):
    account_id: int


class AuthUrlRequest(BaseModel):
    redirect_uri: str
    bank_name: str
    country: str = "PL"


class AuthCallbackRequest(BaseModel):
    code: str
    bank_name: str | None = None


def _validate_config():
    missing = []
    if not APP_ID:
        missing.append("ENABLE_BANKING_APP_ID")
    if not PRIVATE_KEY:
        missing.append("ENABLE_BANKING_PRIVATE_KEY")

    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Missing configuration: {', '.join(missing)}",
        )


def get_bank_token() -> str:
    _validate_config()

    current_time = int(time.time())
    payload = {
        "iss": APP_ID,
        "aud": "api.enablebanking.com",
        "iat": current_time,
        "exp": current_time + 3600,
    }
    headers = {"typ": "JWT", "alg": "RS256", "kid": APP_ID}

    try:
        return jwt.encode(payload, PRIVATE_KEY, algorithm="RS256", headers=headers)
    except Exception as exc:
        logger.error("Error generating JWT: %s", exc)
        raise HTTPException(status_code=500, detail="Error generating access token")


def _fetch_bank_transactions(bank_account_uid: str) -> list:
    token = get_bank_token()
    base_url = f"https://api.enablebanking.com/accounts/{bank_account_uid}/transactions"
    headers = {"Authorization": f"Bearer {token}"}

    all_transactions = []
    continuation_key = None
    pages_fetched = 0

    while pages_fetched < MAX_PAGES:
        params = {"continuation_key": continuation_key} if continuation_key else {}

        try:
            response = requests.get(
                base_url, headers=headers, params=params, timeout=REQUEST_TIMEOUT
            )
        except requests.exceptions.Timeout:
            logger.error("Timeout fetching transactions from Enable Banking")
            raise HTTPException(
                status_code=504, detail="Bank did not respond in time (timeout)"
            )
        except requests.exceptions.RequestException as exc:
            logger.error("Error connecting to Enable Banking: %s", exc)
            raise HTTPException(status_code=502, detail="Failed to connect to the bank")

        if response.status_code == 429:
            logger.warning("Bank rate limit exceeded for account: %s", bank_account_uid)
            raise HTTPException(status_code=429, detail="Bank rate limit exceeded.")

        if response.status_code != 200:
            logger.error(
                "Error fetching transactions (status %s): %s",
                response.status_code,
                response.text,
            )
            raise HTTPException(
                status_code=response.status_code,
                detail="Error fetching data from the bank",
            )

        raw_data = response.json()
        all_transactions.extend(raw_data.get("transactions", []))
        pages_fetched += 1

        continuation_key = raw_data.get("continuation_key")
        if not continuation_key:
            break

    return all_transactions


def _fetch_account_balance(bank_account_uid: str) -> float:
    token = get_bank_token()
    url = f"https://api.enablebanking.com/accounts/{bank_account_uid}/balances"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        if response.status_code != 200:
            logger.warning(
                "Could not fetch balance for account %s (status %s): %s",
                bank_account_uid,
                response.status_code,
                response.text,
            )
            return 0.0

        balances = response.json().get("balances", [])
        if not balances:
            return 0.0

        amount = balances[0].get("balance_amount", {}).get("amount")
        return float(amount) if amount else 0.0
    except (requests.exceptions.RequestException, ValueError, TypeError) as exc:
        logger.warning("Error fetching balance for %s: %s", bank_account_uid, exc)
        return 0.0


def _get_or_create_uncategorized(
    db: sqlalchemy.orm.Session, tx_type: structure.TransactionType
) -> int:
    category = (
        db.query(structure.Category)
        .filter(
            structure.Category.name == "Uncategorized",
            structure.Category.type == tx_type,
        )
        .first()
    )
    if category:
        return category.id_category

    category = structure.Category(name="Uncategorized", type=tx_type)
    db.add(category)
    db.flush()
    return category.id_category


def _build_external_id(tx: dict) -> str:
    entry_reference = tx.get("entry_reference")
    if entry_reference:
        return f"er:{entry_reference}"

    amount = tx.get("transaction_amount", {}).get("amount", "")
    date = tx.get("booking_date", "")
    indicator = tx.get("credit_debit_indicator", "")
    description_list = tx.get("remittance_information", [])
    description = description_list[0] if description_list else ""

    raw = f"{date}|{amount}|{indicator}|{description}"
    return "fb:" + hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


@router.post("/sync")
def sync_bank_transactions(
    request: SyncRequest,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    account = (
        db.query(structure.Account)
        .filter(
            structure.Account.id_account == request.account_id,
            structure.Account.User_id_user == current_user.id_user,
        )
        .first()
    )

    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    if not account.bank_account_uid:
        raise HTTPException(
            status_code=400,
            detail="This account is not linked to a bank (missing bank_account_uid).",
        )

    account_id = account.id_account
    currency_id = account.Currency_id_currency

    raw_transactions = _fetch_bank_transactions(account.bank_account_uid)

    existing_ids = {
        row[0]
        for row in db.query(structure.Transaction.external_id)
        .filter(
            structure.Transaction.Account_id_account == account_id,
            structure.Transaction.external_id.isnot(None),
        )
        .all()
    }

    category_cache = {}
    imported = 0
    skipped = 0
    seen_in_this_batch = set()

    for tx in raw_transactions:
        external_id = _build_external_id(tx)

        if external_id in existing_ids or external_id in seen_in_this_batch:
            skipped += 1
            continue
        seen_in_this_batch.add(external_id)

        amount = tx.get("transaction_amount", {}).get("amount")
        indicator = tx.get("credit_debit_indicator")

        description_list = tx.get("remittance_information", ["No description"])
        description = description_list[0] if description_list else "No description"

        tx_type = (
            structure.TransactionType.INCOME
            if indicator == "CRDT"
            else structure.TransactionType.EXPENSE
        )

        if tx_type not in category_cache:
            category_cache[tx_type] = _get_or_create_uncategorized(db, tx_type)

        new_transaction = structure.Transaction(
            amount=abs(float(amount)) if amount else 0.0,
            date=tx.get("booking_date"),
            description=description.strip(),
            Account_id_account=account_id,
            Category_id_category=category_cache[tx_type],
            Currency_id_currency=currency_id,
            external_id=external_id,
        )
        new_transaction.type = tx_type

        db.add(new_transaction)
        imported += 1

    db.commit()

    logger.info(
        "Sync completed for account %s: imported=%s skipped=%s",
        account_id,
        imported,
        skipped,
    )

    return {"imported": imported, "skipped": skipped}


@router.post("/auth-url")
def generate_auth_url(request: AuthUrlRequest, current_user=Depends(get_current_user)):
    token = get_bank_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    state = str(uuid.uuid4())

    payload = {
        "access": {
            "balances": True,
            "transactions": True,
            "valid_until": (
                datetime.now(timezone.utc) + timedelta(days=90)
            ).isoformat(),
        },
        "aspsp": {
            "name": request.bank_name,
            "country": request.country,
        },
        "state": state,
        "redirect_url": request.redirect_uri,
        "psu_type": "personal",
    }

    try:
        response = requests.post(
            "https://api.enablebanking.com/auth",
            headers=headers,
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )
        if response.status_code != 200:
            logger.error(
                "Error generating auth URL (status %s): %s",
                response.status_code,
                response.text,
            )
            raise HTTPException(
                status_code=response.status_code, detail="Could not generate auth URL."
            )
        data = response.json()
        return {"auth_url": data["url"]}

    except requests.exceptions.RequestException as exc:
        logger.error("Error generating Auth URL: %s", exc)
        raise HTTPException(status_code=500, detail="Could not generate auth URL.")


@router.post("/callback")
def handle_bank_callback(
    request: AuthCallbackRequest,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    token = get_bank_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        session_resp = requests.post(
            "https://api.enablebanking.com/sessions",
            headers=headers,
            json={"code": request.code},
            timeout=REQUEST_TIMEOUT,
        )
        session_resp.raise_for_status()
        session_data = session_resp.json()
    except requests.exceptions.RequestException as exc:
        logger.error("Error exchanging callback code: %s", exc)
        raise HTTPException(
            status_code=400, detail="Invalid authorization code from the bank."
        )

    session_id = session_data.get("session_id")
    valid_until_str = session_data.get("access", {}).get("valid_until")

    try:
        valid_until = datetime.fromisoformat(valid_until_str.replace("Z", "+00:00"))
    except Exception:
        valid_until = datetime.now(timezone.utc)

    new_connection = structure.BankConnection(
        user_id_user=current_user.id_user,
        bank_name=request.bank_name
        or session_data.get("aspsp", {}).get("name", "Unknown Bank"),
        session_id=session_id,
        valid_until=valid_until,
    )
    db.add(new_connection)
    db.flush()

    bank_accounts_data = session_data.get("accounts", [])

    if not bank_accounts_data:
        logger.warning(
            "No accounts returned in session for user %s", current_user.id_user
        )

    imported_accounts = 0

    for acc in bank_accounts_data:
        acc_uid = acc.get("uid")
        if not acc_uid:
            logger.warning("Account without uid in session response, skipping: %s", acc)
            continue

        currency_code = acc.get("currency", "PLN")

        existing_acc = (
            db.query(structure.Account).filter_by(bank_account_uid=acc_uid).first()
        )
        if existing_acc:
            continue

        db_currency = db.query(structure.Currency).filter_by(code=currency_code).first()
        if not db_currency:
            db_currency = db.query(structure.Currency).first()

        balance = _fetch_account_balance(acc_uid)

        new_account = structure.Account(
            name=f"Bank Account ({acc_uid[-4:]})",
            current_balance=balance,
            Currency_id_currency=db_currency.id_currency,
            User_id_user=current_user.id_user,
            bank_connection_id=new_connection.id_connection,
            bank_account_uid=acc_uid,
        )
        db.add(new_account)
        imported_accounts += 1

    db.commit()

    return {
        "message": "Authorization completed successfully!",
        "imported_accounts": imported_accounts,
    }
