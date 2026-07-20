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
