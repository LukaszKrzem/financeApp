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

    category_name = None
    if new_scheduled.category_id:
        category = (
            db.query(structure.Category)
            .filter(structure.Category.id_category == new_scheduled.category_id)
            .first()
        )
        if category:
            category_name = category.name

    return {
        "id_schedule_transaction": new_scheduled.id_schedule_transaction,
        "type": new_scheduled.type,
        "frequency": new_scheduled.frequency,
        "next_date": new_scheduled.next_date,
        "amount": new_scheduled.amount,
        "description": new_scheduled.description,
        "exchange_rate_snapshot": new_scheduled.exchange_rate_snapshot,
        "account_id": new_scheduled.account_id,
        "category_id": new_scheduled.category_id,
        "currency_id": new_scheduled.currency_id,
        "account_name": account.name,
        "category_name": category_name,
        "currency_code": currency.code,
    }


def get_user_scheduled_transactions(db: sqlalchemy.orm.Session, user_id: int):
    results = (
        db.query(
            structure.ScheduledTransaction,
            structure.Account.name.label("account_name"),
            structure.Category.name.label("category_name"),
            structure.Currency.code.label("currency_code"),
        )
        .join(
            structure.Account,
            structure.ScheduledTransaction.account_id == structure.Account.id_account,
        )
        .outerjoin(
            structure.Category,
            structure.ScheduledTransaction.category_id
            == structure.Category.id_category,
        )
        .join(
            structure.Currency,
            structure.ScheduledTransaction.currency_id
            == structure.Currency.id_currency,
        )
        .filter(structure.Account.user_id == user_id)
        .all()
    )

    formatted_results = []
    for tx, acc_name, cat_name, cur_code in results:
        tx_dict = {
            "id_schedule_transaction": tx.id_schedule_transaction,
            "type": tx.type,
            "frequency": tx.frequency,
            "next_date": tx.next_date,
            "amount": tx.amount,
            "description": tx.description,
            "exchange_rate_snapshot": tx.exchange_rate_snapshot,
            "account_id": tx.account_id,
            "category_id": tx.category_id,
            "currency_id": tx.currency_id,
            "account_name": acc_name,
            "category_name": cat_name,
            "currency_code": cur_code,
        }
        formatted_results.append(tx_dict)

    return formatted_results


def update_scheduled_transaction(
    db: sqlalchemy.orm.Session,
    transaction_id: int,
    data: scheduled_dto.ScheduledTransactionUpdate,
    user_id: int,
) -> dict:

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

    account = (
        db.query(structure.Account)
        .filter(structure.Account.id_account == db_transaction.account_id)
        .first()
    )
    currency = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == db_transaction.currency_id)
        .first()
    )
    category_name = None
    if db_transaction.category_id:
        category = (
            db.query(structure.Category)
            .filter(structure.Category.id_category == db_transaction.category_id)
            .first()
        )
        if category:
            category_name = category.name

    return {
        "id_schedule_transaction": db_transaction.id_schedule_transaction,
        "type": db_transaction.type,
        "frequency": db_transaction.frequency,
        "next_date": db_transaction.next_date,
        "amount": db_transaction.amount,
        "description": db_transaction.description,
        "exchange_rate_snapshot": db_transaction.exchange_rate_snapshot,
        "account_id": db_transaction.account_id,
        "category_id": db_transaction.category_id,
        "currency_id": db_transaction.currency_id,
        "account_name": account.name if account else None,
        "category_name": category_name,
        "currency_code": currency.code if currency else None,
    }


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
