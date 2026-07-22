import logging
from datetime import datetime, timedelta
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
    rate_trans: Decimal,
    amount: Decimal,
    tx_type: structure.TransactionType,
    reverse: bool = False,
):
    currency_account = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == account.currency_id)
        .first()
    )
    if not currency_account:
        raise HTTPException(status_code=404, detail="Account currency not found.")

    rate_account = Decimal(str(currency_account.exchange_rate))
    if rate_account == Decimal("0"):
        raise HTTPException(status_code=400, detail="Invalid account exchange rate.")

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
        .filter(structure.Account.id_account == tx.account_id)
        .first()
    )
    if not account or account.user_id != user_id:
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
        .filter(structure.Account.id_account == transaction_data.account_id)
        .first()
    )

    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")
    if account.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied to this account.")

    currency_trans = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == transaction_data.currency_id)
        .first()
    )
    if not currency_trans:
        raise HTTPException(status_code=404, detail="Transaction currency not found.")

    snapshot_rate = Decimal(str(currency_trans.exchange_rate))

    _apply_balance_change(
        db, account, snapshot_rate, transaction_data.amount, transaction_data.type
    )

    new_transaction = structure.Transaction(
        amount=transaction_data.amount,
        date=transaction_data.date,
        description=transaction_data.description,
        type=transaction_data.type,
        exchange_rate_snapshot=snapshot_rate,
        account_id=transaction_data.account_id,
        category_id=transaction_data.category_id,
        currency_id=transaction_data.currency_id,
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    category = (
        db.query(structure.Category)
        .filter(structure.Category.id_category == new_transaction.category_id)
        .first()
    )

    return {
        "id_transaction": new_transaction.id_transaction,
        "amount": new_transaction.amount,
        "date": new_transaction.date,
        "description": new_transaction.description,
        "type": new_transaction.type,
        "exchange_rate_snapshot": new_transaction.exchange_rate_snapshot,
        "account_id": new_transaction.account_id,
        "category_id": new_transaction.category_id,
        "currency_id": new_transaction.currency_id,
        "category_name": category.name if category else "Other",
        "currency_code": currency_trans.code,
    }


def get_user_transactions(db: sqlalchemy.orm.Session, user_id: int) -> List[dict]:
    results = (
        db.query(structure.Transaction, structure.Category, structure.Currency)
        .join(
            structure.Account,
            structure.Transaction.account_id == structure.Account.id_account,
        )
        .outerjoin(
            structure.Category,
            structure.Transaction.category_id == structure.Category.id_category,
        )
        .join(
            structure.Currency,
            structure.Transaction.currency_id == structure.Currency.id_currency,
        )
        .filter(structure.Account.user_id == user_id)
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
            "exchange_rate_snapshot": trans.exchange_rate_snapshot,
            "account_id": trans.account_id,
            "category_id": trans.category_id,
            "currency_id": trans.currency_id,
            "category_name": cat.name if cat else "Other",
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

    update_data = transaction_data.model_dump(exclude_unset=True)

    new_account = old_account
    if (
        "account_id" in update_data
        and update_data["account_id"] != old_account.id_account
    ):
        new_account = (
            db.query(structure.Account)
            .filter(structure.Account.id_account == update_data["account_id"])
            .first()
        )
        if not new_account or new_account.user_id != user_id:
            raise HTTPException(
                status_code=403, detail="Account not found or access denied."
            )

    _apply_balance_change(
        db,
        old_account,
        Decimal(str(tx.exchange_rate_snapshot)),
        tx.amount,
        tx.type,
        reverse=True,
    )

    new_snapshot_rate = Decimal(str(tx.exchange_rate_snapshot))
    if "currency_id" in update_data and update_data["currency_id"] != tx.currency_id:
        new_currency = (
            db.query(structure.Currency)
            .filter(structure.Currency.id_currency == update_data["currency_id"])
            .first()
        )
        if not new_currency:
            raise HTTPException(status_code=404, detail="Currency not found.")
        new_snapshot_rate = Decimal(str(new_currency.exchange_rate))
        update_data["exchange_rate_snapshot"] = new_snapshot_rate

    for key, value in update_data.items():
        setattr(tx, key, value)

    _apply_balance_change(db, new_account, new_snapshot_rate, tx.amount, tx.type)

    db.commit()
    db.refresh(tx)

    category = (
        db.query(structure.Category)
        .filter(structure.Category.id_category == tx.category_id)
        .first()
    )

    currency_trans = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == tx.currency_id)
        .first()
    )

    return {
        "id_transaction": tx.id_transaction,
        "amount": tx.amount,
        "date": tx.date,
        "description": tx.description,
        "type": tx.type,
        "exchange_rate_snapshot": tx.exchange_rate_snapshot,
        "account_id": tx.account_id,
        "category_id": tx.category_id,
        "currency_id": tx.currency_id,
        "category_name": category.name if category else "Other",
        "currency_code": currency_trans.code if currency_trans else None,
    }


def delete_user_transaction(
    db: sqlalchemy.orm.Session, transaction_id: int, user_id: int
):
    tx, account = _get_owned_transaction(db, transaction_id, user_id)

    _apply_balance_change(
        db,
        account,
        Decimal(str(tx.exchange_rate_snapshot)),
        tx.amount,
        tx.type,
        reverse=True,
    )

    db.delete(tx)
    db.commit()
