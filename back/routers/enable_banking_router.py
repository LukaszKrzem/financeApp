import base64
import logging
import os
import time

import jwt
import requests
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


@router.get("/transactions")
def get_recent_transactions(current_user=Depends(get_current_user)):
    token = get_bank_token()
    url = f"https://api.enablebanking.com/accounts/{ACCOUNT_UID}/transactions"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
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
            status_code=response.status_code, detail="Error fetching data from the bank"
        )

    raw_data = response.json()
    transactions = raw_data.get("transactions", [])

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
