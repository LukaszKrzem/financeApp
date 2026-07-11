import logging

import sqlalchemy
import sqlalchemy.orm
from fastapi import HTTPException

import back.dto.account_dto as account_dto
import back.structure as structure

logger = logging.getLogger(__name__)


def run_scheduled_transactions_catchup(db: sqlalchemy.orm.Session, user_id: int):
    try:
        db.execute(
            sqlalchemy.text("CALL catch_up_scheduled_transactions(:user_id)"),
            {"user_id": user_id},
        )
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Error running catch_up_scheduled_transactions: %s", e)


def get_user_accounts(db: sqlalchemy.orm.Session, user_id: int) -> list[dict]:
    results = (
        db.query(structure.Account, structure.Currency)
        .join(
            structure.Currency,
            structure.Account.Currency_id_currency == structure.Currency.id_currency,
        )
        .filter(structure.Account.User_id_user == user_id)
        .all()
    )

    return [
        {
            "id_account": account.id_account,
            "name": account.name,
            "current_balance": account.current_balance,
            "Currency_id_currency": account.Currency_id_currency,
            "currency_code": currency.code,
            "bank_account_uid": account.bank_account_uid,
            "bank_connection_id": account.bank_connection_id,
        }
        for account, currency in results
    ]


def create_user_account(
    db: sqlalchemy.orm.Session, account_data: account_dto.AccountCreate, user_id: int
) -> dict:
    currency = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == account_data.Currency_id_currency)
        .first()
    )
    if not currency:
        raise HTTPException(status_code=404, detail="Selected currency not found.")

    new_account = structure.Account(
        name=account_data.name,
        current_balance=account_data.current_balance,
        Currency_id_currency=account_data.Currency_id_currency,
        User_id_user=user_id,
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return {
        "id_account": new_account.id_account,
        "name": new_account.name,
        "current_balance": new_account.current_balance,
        "Currency_id_currency": new_account.Currency_id_currency,
        "currency_code": currency.code,
        "bank_account_uid": new_account.bank_account_uid,
        "bank_connection_id": new_account.bank_connection_id,
    }


def update_user_account(
    db: sqlalchemy.orm.Session,
    account_id: int,
    account_data: account_dto.AccountUpdate,
    user_id: int,
) -> dict:
    result = (
        db.query(structure.Account, structure.Currency)
        .join(
            structure.Currency,
            structure.Account.Currency_id_currency == structure.Currency.id_currency,
        )
        .filter(
            structure.Account.id_account == account_id,
            structure.Account.User_id_user == user_id,
        )
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="Account not found.")

    account, currency = result
    account.name = account_data.name
    db.commit()
    db.refresh(account)

    return {
        "id_account": account.id_account,
        "name": account.name,
        "current_balance": account.current_balance,
        "Currency_id_currency": account.Currency_id_currency,
        "currency_code": currency.code,
        "bank_account_uid": account.bank_account_uid,
        "bank_connection_id": account.bank_connection_id,
    }


def delete_user_account(db: sqlalchemy.orm.Session, account_id: int, user_id: int):
    account = (
        db.query(structure.Account)
        .filter(
            structure.Account.id_account == account_id,
            structure.Account.User_id_user == user_id,
        )
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    db.delete(account)
    db.commit()
    return None
