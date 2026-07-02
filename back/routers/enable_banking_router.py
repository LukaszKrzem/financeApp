import base64
import logging
import os
import time

import back.structure as structure
import jwt
import requests
import sqlalchemy.orm
from back.database import get_db
from back.dependencies import get_current_user
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/banking", tags=["Banking"])

APP_ID = os.getenv("ENABLE_BANKING_APP_ID")
ACCOUNT_UID = os.getenv("ENABLE_BANKING_ACCOUNT_UID")
_b64 = os.getenv("ENABLE_BANKING_PRIVATE_KEY_B64")
PRIVATE_KEY = base64.b64decode(_b64).decode("utf-8") if _b64 else None
# TODO: change that hardcoded values
LOCAL_ACCOUNT_ID_FOR_BANK_SYNC = os.getenv("LOCAL_ACCOUNT_ID_FOR_BANK_SYNC")
LOCAL_CURRENCY_ID_FOR_BANK_SYNC = os.getenv("LOCAL_CURRENCY_ID_FOR_BANK_SYNC")

REQUEST_TIMEOUT = 10


def _validate_config():
    missing = []
    if not APP_ID:
        missing.append("ENABLE_BANKING_APP_ID")
    if not ACCOUNT_UID:
        missing.append("ENABLE_BANKING_ACCOUNT_UID")
    if not PRIVATE_KEY:
        missing.append("ENABLE_BANKING_PRIVATE_KEY")

    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Missing configuration: {', '.join(missing)}",
        )


def _validate_sync_config():
    missing = []
    if not LOCAL_ACCOUNT_ID_FOR_BANK_SYNC:
        missing.append("LOCAL_ACCOUNT_ID_FOR_BANK_SYNC")
    if not LOCAL_CURRENCY_ID_FOR_BANK_SYNC:
        missing.append("LOCAL_CURRENCY_ID_FOR_BANK_SYNC")

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


def _fetch_bank_transactions() -> list:
    token = get_bank_token()
    base_url = f"https://api.enablebanking.com/accounts/{ACCOUNT_UID}/transactions"
    headers = {"Authorization": f"Bearer {token}"}

    all_transactions = []
    continuation_key = None

    while True:
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

        continuation_key = raw_data.get("continuation_key")
        if not continuation_key:
            break

    return all_transactions


@router.get("/transactions")
def get_recent_transactions(current_user=Depends(get_current_user)):
    """Podgląd transakcji z banku, bez zapisu do bazy. Przydatne do debugowania."""
    transactions = _fetch_bank_transactions()

    formatted_transactions = []

    for tx in transactions:
        amount = tx.get("transaction_amount", {}).get("amount")
        indicator = tx.get("credit_debit_indicator")

        description_list = tx.get("remittance_information", ["No description"])
        description = description_list[0] if description_list else "No description"

        formatted_transactions.append(
            {
                "date": tx.get("booking_date"),
                "amount": float(amount) if amount else 0.0,
                "type": indicator,
                "description": description.strip(),
            }
        )

    return {"transactions": formatted_transactions}


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


@router.post("/sync")
def sync_bank_transactions(
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    _validate_sync_config()

    raw_transactions = _fetch_bank_transactions()
    category_cache = {}

    imported = 0

    for tx in raw_transactions:
        amount = tx.get("transaction_amount", {}).get("amount")
        indicator = tx.get(
            "credit_debit_indicator"
        )  # "CRDT" (przychód) / "DBIT" (wydatek)

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
            Account_id_account=int(LOCAL_ACCOUNT_ID_FOR_BANK_SYNC),
            Category_id_category=category_cache[tx_type],
            Currency_id_currency=int(LOCAL_CURRENCY_ID_FOR_BANK_SYNC),
        )
        new_transaction.type = tx_type

        db.add(new_transaction)
        imported += 1

    db.commit()

    return {"imported": imported}
