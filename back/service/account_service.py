import logging

import sqlalchemy
import sqlalchemy.orm
from fastapi import HTTPException

import back.dto.account_dto as account_dto
import back.structure as structure

logger = logging.getLogger(__name__)


def run_scheduled_transactions_catchup(db: sqlalchemy.orm.Session, user_id: int):
    try:
        with db.begin_nested():
            db.execute(
                sqlalchemy.text("CALL catch_up_scheduled_transactions(:user_id)"),
                {"user_id": user_id},
            )
    except Exception as e:
        logger.debug(
            "catch_up_scheduled_transactions procedure not supported or failed: %s", e
        )


def get_user_accounts(
    db: sqlalchemy.orm.Session, user_id: int
) -> list[structure.Account]:
    run_scheduled_transactions_catchup(db, user_id)
    return (
        db.query(structure.Account)
        .options(sqlalchemy.orm.joinedload(structure.Account.currency))
        .filter(structure.Account.user_id == user_id)
        .all()
    )


def create_user_account(
    db: sqlalchemy.orm.Session, account_data: account_dto.AccountCreate, user_id: int
) -> structure.Account:
    currency = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == account_data.currency_id)
        .first()
    )
    if not currency:
        raise HTTPException(status_code=404, detail="Selected currency not found.")

    new_account = structure.Account(
        name=account_data.name,
        current_balance=account_data.current_balance,
        currency_id=account_data.currency_id,
        user_id=user_id,
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account


def update_user_account(
    db: sqlalchemy.orm.Session,
    account_id: int,
    account_data: account_dto.AccountUpdate,
    user_id: int,
) -> structure.Account:
    account = (
        db.query(structure.Account)
        .options(sqlalchemy.orm.joinedload(structure.Account.currency))
        .filter(
            structure.Account.id_account == account_id,
            structure.Account.user_id == user_id,
        )
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    account.name = account_data.name
    db.commit()
    db.refresh(account)
    return account


def delete_user_account(db: sqlalchemy.orm.Session, account_id: int, user_id: int):
    account = (
        db.query(structure.Account)
        .filter(
            structure.Account.id_account == account_id,
            structure.Account.user_id == user_id,
        )
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    db.delete(account)
    db.commit()
    return None
