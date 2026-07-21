from typing import List

import sqlalchemy.orm
from fastapi import HTTPException

import back.dto.scheduled_transaction_dto as scheduled_dto
import back.structure as structure


def create_scheduled_transaction(
    db: sqlalchemy.orm.Session,
    data: scheduled_dto.ScheduledTransactionCreate,
    user_id: int,
) -> structure.ScheduledTransaction:

    account = (
        db.query(structure.Account)
        .filter(structure.Account.id_account == data.Account_id_account)
        .first()
    )

    if not account or account.User_id_user != user_id:
        raise HTTPException(
            status_code=403, detail="Account not accessible or does not exist"
        )

    # Quirk handling: user sends amount in positive form, we adjust based on type
    final_amount = abs(data.amount)
    if data.type == structure.TransactionType.EXPENSE:
        final_amount = -final_amount

    new_scheduled = structure.ScheduledTransaction(
        frequency=data.frequency,
        next_date=data.date,
        amount=final_amount,
        description=data.description,
        Account_id_account=data.Account_id_account,
        Category_id_category=data.Category_id_category,
        Currency_id_currency=data.Currency_id_currency,
    )

    db.add(new_scheduled)
    db.commit()
    db.refresh(new_scheduled)

    return new_scheduled


def get_user_scheduled_transactions(
    db: sqlalchemy.orm.Session, user_id: int
) -> List[structure.ScheduledTransaction]:

    results = (
        db.query(structure.ScheduledTransaction)
        .join(
            structure.Account,
            structure.ScheduledTransaction.Account_id_account
            == structure.Account.id_account,
        )
        .filter(structure.Account.User_id_user == user_id)
        .all()
    )

    return results


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
            structure.ScheduledTransaction.Account_id_account
            == structure.Account.id_account,
        )
        .filter(
            structure.ScheduledTransaction.id_schedule_transaction == transaction_id,
            structure.Account.User_id_user == user_id,
        )
        .first()
    )

    if not db_transaction:
        raise HTTPException(
            status_code=404, detail="Transaction not found or access denied"
        )

    if data.Account_id_account is not None:
        new_account = (
            db.query(structure.Account)
            .filter(structure.Account.id_account == data.Account_id_account)
            .first()
        )
        if not new_account or new_account.User_id_user != user_id:
            raise HTTPException(
                status_code=403, detail="New account not accessible or does not exist"
            )

    update_data = data.model_dump(exclude_unset=True)

    if "amount" in update_data or "type" in update_data:
        current_amount = update_data.get("amount", abs(db_transaction.amount))

        current_type = update_data.get("type")
        if not current_type:
            current_type = (
                structure.TransactionType.EXPENSE
                if db_transaction.amount < 0
                else structure.TransactionType.INCOME
            )

        final_amount = abs(current_amount)
        if current_type == structure.TransactionType.EXPENSE:
            final_amount = -final_amount

        db_transaction.amount = final_amount

        update_data.pop("amount", None)
        update_data.pop("type", None)

    if "date" in update_data:
        db_transaction.next_date = update_data.pop("date")

    for key, value in update_data.items():
        setattr(db_transaction, key, value)

    db.commit()
    db.refresh(db_transaction)

    return db_transaction


def delete_scheduled_transaction(
    db: sqlalchemy.orm.Session, transaction_id: int, user_id: int
):
    db_transaction = (
        db.query(structure.ScheduledTransaction)
        .join(
            structure.Account,
            structure.ScheduledTransaction.Account_id_account
            == structure.Account.id_account,
        )
        .filter(
            structure.ScheduledTransaction.id_schedule_transaction == transaction_id,
            structure.Account.User_id_user == user_id,
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
