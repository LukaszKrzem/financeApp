import sqlalchemy.orm
from fastapi import HTTPException

import back.dto.scheduled_transaction_dto as scheduled_dto
import back.structure as structure


def create_scheduled_transaction(
    db: sqlalchemy.orm.Session,
    data: scheduled_dto.ScheduledTransactionCreate,
    user_id: int,
) -> dict:

    account = (
        db.query(structure.Account)
        .filter(structure.Account.id_account == data.account_id)
        .first()
    )

    if not account or account.user_id != user_id:
        raise HTTPException(
            status_code=403, detail="Account not accessible or does not exist"
        )

    currency = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == data.currency_id)
        .first()
    )
    if not currency:
        raise HTTPException(status_code=404, detail="Currency not found")

    new_scheduled = structure.ScheduledTransaction(
        type=data.type,
        frequency=data.frequency,
        next_date=data.date,
        amount=data.amount,
        description=data.description,
        exchange_rate_snapshot=currency.exchange_rate,
        account_id=data.account_id,
        category_id=data.category_id,
        currency_id=data.currency_id,
    )

    db.add(new_scheduled)
    db.commit()
    db.refresh(new_scheduled)

    return (
        db.query(structure.ScheduledTransaction)
        .options(
            sqlalchemy.orm.joinedload(structure.ScheduledTransaction.account),
            sqlalchemy.orm.joinedload(structure.ScheduledTransaction.currency),
            sqlalchemy.orm.joinedload(structure.ScheduledTransaction.category),
        )
        .filter(
            structure.ScheduledTransaction.id_schedule_transaction
            == new_scheduled.id_schedule_transaction
        )
        .first()
    )


def get_user_scheduled_transactions(
    db: sqlalchemy.orm.Session, user_id: int
) -> list[structure.ScheduledTransaction]:
    return (
        db.query(structure.ScheduledTransaction)
        .join(
            structure.Account,
            structure.ScheduledTransaction.account_id == structure.Account.id_account,
        )
        .options(
            sqlalchemy.orm.joinedload(structure.ScheduledTransaction.account),
            sqlalchemy.orm.joinedload(structure.ScheduledTransaction.currency),
            sqlalchemy.orm.joinedload(structure.ScheduledTransaction.category),
        )
        .filter(structure.Account.user_id == user_id)
        .all()
    )


def update_scheduled_transaction(
    db: sqlalchemy.orm.Session,
    transaction_id: int,
    data: scheduled_dto.ScheduledTransactionUpdate,
    user_id: int,
) -> structure.ScheduledTransaction:
    db_transaction = (
        db.query(structure.ScheduledTransaction)
        .join(
            structure.Account,
            structure.ScheduledTransaction.account_id == structure.Account.id_account,
        )
        .filter(
            structure.ScheduledTransaction.id_schedule_transaction == transaction_id,
            structure.Account.user_id == user_id,
        )
        .first()
    )

    if not db_transaction:
        raise HTTPException(
            status_code=404, detail="Transaction not found or access denied"
        )

    if data.account_id is not None:
        new_account = (
            db.query(structure.Account)
            .filter(structure.Account.id_account == data.account_id)
            .first()
        )
        if not new_account or new_account.user_id != user_id:
            raise HTTPException(
                status_code=403, detail="New account not accessible or does not exist"
            )

    update_data = data.model_dump(exclude_unset=True)

    if "date" in update_data:
        update_data["next_date"] = update_data.pop("date")

    if "currency_id" in update_data:
        new_currency = (
            db.query(structure.Currency)
            .filter(structure.Currency.id_currency == update_data["currency_id"])
            .first()
        )
        if new_currency:
            update_data["exchange_rate_snapshot"] = new_currency.exchange_rate

    for key, value in update_data.items():
        setattr(db_transaction, key, value)

    db.commit()
    db.refresh(db_transaction)

    return (
        db.query(structure.ScheduledTransaction)
        .options(
            sqlalchemy.orm.joinedload(structure.ScheduledTransaction.account),
            sqlalchemy.orm.joinedload(structure.ScheduledTransaction.currency),
            sqlalchemy.orm.joinedload(structure.ScheduledTransaction.category),
        )
        .filter(
            structure.ScheduledTransaction.id_schedule_transaction == transaction_id
        )
        .first()
    )


def delete_scheduled_transaction(
    db: sqlalchemy.orm.Session, transaction_id: int, user_id: int
):
    db_transaction = (
        db.query(structure.ScheduledTransaction)
        .join(
            structure.Account,
            structure.ScheduledTransaction.account_id == structure.Account.id_account,
        )
        .filter(
            structure.ScheduledTransaction.id_schedule_transaction == transaction_id,
            structure.Account.user_id == user_id,
        )
        .first()
    )

    if not db_transaction:
        raise HTTPException(
            status_code=404, detail="Transaction not found or access denied"
        )

    db.delete(db_transaction)
    db.commit()

    return None
