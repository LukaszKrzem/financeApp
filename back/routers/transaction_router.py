from fastapi import APIRouter, Depends, HTTPException, status
import sqlalchemy.orm
from typing import List

from back.database import get_db
from back.dependencies import get_current_user
import back.dto.transaction_dto as transaction_dto
import back.structure as structure

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/", response_model=transaction_dto.TransactionOut)
def create_transaction(
    transaction_data: transaction_dto.TransactionCreate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    account = db.query(structure.Account).filter(
        structure.Account.id_account == transaction_data.Account_id_account
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Konto nie zostało znalezione.")

    if account.User_id_user != current_user.id_user:
        raise HTTPException(status_code=403, detail="Brak dostępu do tego konta.")

    if transaction_data.type == structure.TransactionType.INCOME:
        account.current_balance += transaction_data.amount
    elif transaction_data.type == structure.TransactionType.EXPENSE:
        account.current_balance -= transaction_data.amount

    new_transaction = structure.Transaction(
        amount=transaction_data.amount,
        description=transaction_data.description,
        type=transaction_data.type,
        Account_id_account=transaction_data.Account_id_account,
        Category_id_category=transaction_data.Category_id_category
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


@router.get("/", response_model=List[transaction_dto.TransactionOut])
def get_transactions(
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    transactions = (
        db.query(structure.Transaction)
        .join(structure.Account)
        .filter(structure.Account.User_id_user == current_user.id_user)
        .all()
    )

    return transactions

from typing import List

@router.get("/", response_model=List[transaction_dto.TransactionOut])
def get_user_transactions(
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    results = db.query(structure.Transaction, structure.Category).outerjoin(
        structure.Category,
        structure.Transaction.Category_id_category == structure.Category.id_category
    ).filter(
        structure.Transaction.Account_id_account == structure.Account.id_account,
        structure.Account.User_id_user == current_user.id_user
    ).order_by(structure.Transaction.date.desc()).all()

    transactions_with_data = []
    for trans, cat in results:
        transactions_with_data.append({
            "id_transaction": trans.id_transaction,
            "amount": trans.amount,
            "date": trans.date,
            "description": trans.description,
            "type": trans.type,
            "Account_id_account": trans.Account_id_account,
            "category_name": cat.name if cat else "Other"
        })
    return transactions_with_data