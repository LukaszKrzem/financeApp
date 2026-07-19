import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List

import httpx
import sqlalchemy.orm
from fastapi import HTTPException

import back.dto.transaction_dto as transaction_dto
import back.structure as structure

logger = logging.getLogger(__name__)

NBP_API_URL = "http://api.nbp.pl/api/exchangerates/tables/A/?format=json"
LAST_NBP_UPDATE = None
CACHE_DURATION_HOURS = 12


def update_rates_from_nbp_internal(db: sqlalchemy.orm.Session):
    global LAST_NBP_UPDATE
    now = datetime.now()

    if LAST_NBP_UPDATE is not None:
        if now - LAST_NBP_UPDATE < timedelta(hours=CACHE_DURATION_HOURS):
            return

    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(NBP_API_URL)

        if response.status_code == 200:
            nbp_data = response.json()
            rates = nbp_data[0].get("rates", [])
            for rate in rates:
                currency_code = rate.get("code")
                currency_name = rate.get("currency")
                mid_rate = Decimal(str(rate.get("mid")))

                db_currency = (
                    db.query(structure.Currency)
                    .filter(structure.Currency.code == currency_code)
                    .first()
                )

                if db_currency:
                    db_currency.exchange_rate = mid_rate
                else:
                    new_currency = structure.Currency(
                        code=currency_code, name=currency_name, exchange_rate=mid_rate
                    )
                    db.add(new_currency)

            db.commit()
            LAST_NBP_UPDATE = now

    except Exception as e:
        logger.error(f"Error updating rates from NBP: {e}")


def _apply_balance_change(
    db: sqlalchemy.orm.Session,
    account: structure.Account,
    currency_trans: structure.Currency,
    amount: Decimal,
    tx_type: structure.TransactionType,
    reverse: bool = False,
):
    currency_account = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == account.Currency_id_currency)
        .first()
    )
    if not currency_account:
        raise HTTPException(status_code=404, detail="Account currency not found.")

    rate_account = Decimal(str(currency_account.exchange_rate))
    if rate_account == Decimal("0"):
        raise HTTPException(status_code=400, detail="Invalid exchange rate.")

    rate_trans = Decimal(str(currency_trans.exchange_rate))

    raw_converted = Decimal(str(amount)) * (rate_trans / rate_account)
    converted_amount = raw_converted.quantize(Decimal("0.01"))

    is_income = tx_type == structure.TransactionType.INCOME
    if reverse:
        is_income = not is_income

    if is_income:
        account.current_balance += converted_amount
    else:
        account.current_balance -= converted_amount


def _get_owned_transaction(
    db: sqlalchemy.orm.Session, transaction_id: int, user_id: int
):
    tx = (
        db.query(structure.Transaction)
        .filter(structure.Transaction.id_transaction == transaction_id)
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    account = (
        db.query(structure.Account)
        .filter(structure.Account.id_account == tx.Account_id_account)
        .first()
    )
    if not account or account.User_id_user != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return tx, account


def create_user_transaction(
    db: sqlalchemy.orm.Session,
    transaction_data: transaction_dto.TransactionCreate,
    user_id: int,
) -> dict:
    update_rates_from_nbp_internal(db)

    account = (
        db.query(structure.Account)
        .filter(structure.Account.id_account == transaction_data.Account_id_account)
        .first()
    )

    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")
    if account.User_id_user != user_id:
        raise HTTPException(status_code=403, detail="Access denied to this account.")

    currency_trans = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == transaction_data.Currency_id_currency)
        .first()
    )
    if not currency_trans:
        raise HTTPException(status_code=404, detail="Transaction currency not found.")

    _apply_balance_change(
        db, account, currency_trans, transaction_data.amount, transaction_data.type
    )

    tx_date = getattr(transaction_data, "date", datetime.now(timezone.utc))

    new_transaction = structure.Transaction(
        amount=transaction_data.amount,
        date=tx_date,
        description=transaction_data.description,
        type=transaction_data.type,
        Account_id_account=transaction_data.Account_id_account,
        Category_id_category=transaction_data.Category_id_category,
        Currency_id_currency=transaction_data.Currency_id_currency,
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    category = (
        db.query(structure.Category)
        .filter(structure.Category.id_category == new_transaction.Category_id_category)
        .first()
    )

    return {
        "id_transaction": new_transaction.id_transaction,
        "amount": new_transaction.amount,
        "date": new_transaction.date,
        "description": new_transaction.description,
        "type": new_transaction.type,
        "Account_id_account": new_transaction.Account_id_account,
        "Category_id_category": new_transaction.Category_id_category,
        "Currency_id_currency": new_transaction.Currency_id_currency,
        "category_name": category.name if category else "Other",
        "exchange_rate": currency_trans.exchange_rate if currency_trans else None,
        "currency_code": currency_trans.code if currency_trans else None,
    }


def get_user_transactions(db: sqlalchemy.orm.Session, user_id: int) -> List[dict]:
    results = (
        db.query(structure.Transaction, structure.Category, structure.Currency)
        .join(
            structure.Account,
            structure.Transaction.Account_id_account == structure.Account.id_account,
        )
        .outerjoin(
            structure.Category,
            structure.Transaction.Category_id_category
            == structure.Category.id_category,
        )
        .join(
            structure.Currency,
            structure.Transaction.Currency_id_currency
            == structure.Currency.id_currency,
        )
        .filter(structure.Account.User_id_user == user_id)
        .order_by(structure.Transaction.date.desc())
        .all()
    )

    return [
        {
            "id_transaction": trans.id_transaction,
            "amount": trans.amount,
            "date": trans.date,
            "description": trans.description,
            "type": trans.type,
            "Account_id_account": trans.Account_id_account,
            "Category_id_category": trans.Category_id_category,
            "Currency_id_currency": trans.Currency_id_currency,
            "category_name": cat.name if cat else "Other",
            "exchange_rate": cur.exchange_rate if cur else None,
            "currency_code": cur.code if cur else None,
        }
        for trans, cat, cur in results
    ]


def update_user_transaction(
    db: sqlalchemy.orm.Session,
    transaction_id: int,
    transaction_data: transaction_dto.TransactionUpdate,
    user_id: int,
) -> dict:
    tx, old_account = _get_owned_transaction(db, transaction_id, user_id)

    new_account = (
        db.query(structure.Account)
        .filter(structure.Account.id_account == transaction_data.Account_id_account)
        .first()
    )
    if not new_account or new_account.User_id_user != user_id:
        raise HTTPException(
            status_code=403, detail="Account not found or access denied."
        )

    old_currency = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == tx.Currency_id_currency)
        .first()
    )
    new_currency = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == transaction_data.Currency_id_currency)
        .first()
    )

    if not old_currency or not new_currency:
        raise HTTPException(status_code=404, detail="Currency not found.")

    _apply_balance_change(
        db, old_account, old_currency, tx.amount, tx.type, reverse=True
    )
    _apply_balance_change(
        db, new_account, new_currency, transaction_data.amount, transaction_data.type
    )

    tx.amount = transaction_data.amount
    tx.description = transaction_data.description
    tx.type = transaction_data.type
    tx.Account_id_account = transaction_data.Account_id_account
    tx.Category_id_category = transaction_data.Category_id_category
    tx.Currency_id_currency = transaction_data.Currency_id_currency
    if hasattr(transaction_data, "date") and transaction_data.date:
        tx.date = transaction_data.date

    db.commit()
    db.refresh(tx)

    category = (
        db.query(structure.Category)
        .filter(structure.Category.id_category == tx.Category_id_category)
        .first()
    )

    return {
        "id_transaction": tx.id_transaction,
        "amount": tx.amount,
        "date": tx.date,
        "description": tx.description,
        "type": tx.type,
        "Account_id_account": tx.Account_id_account,
        "Category_id_category": tx.Category_id_category,
        "Currency_id_currency": tx.Currency_id_currency,
        "category_name": category.name if category else "Other",
        "exchange_rate": new_currency.exchange_rate,
        "currency_code": new_currency.code,
    }


def delete_user_transaction(
    db: sqlalchemy.orm.Session, transaction_id: int, user_id: int
):
    tx, account = _get_owned_transaction(db, transaction_id, user_id)

    currency_trans = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == tx.Currency_id_currency)
        .first()
    )
    if not currency_trans:
        raise HTTPException(status_code=404, detail="Transaction currency not found.")

    _apply_balance_change(db, account, currency_trans, tx.amount, tx.type, reverse=True)

    db.delete(tx)
    db.commit()
