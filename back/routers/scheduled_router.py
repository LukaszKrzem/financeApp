# I didnt do user service coz tbh here we have a total of 0 complicated logic all is in sql

from fastapi import APIRouter, Depends, HTTPException
import sqlalchemy.orm
from typing import List
from back.database import get_db
from back.dependencies import get_current_user
import back.structure as structure
import back.dto.scheduled_transaction_dto as scheduled_dto 

router = APIRouter(prefix="/scheduled-transactions", tags=["Scheduled Transactions"])

# Endpoint to create a new scheduled transaction. Returns the created scheduled transaction data
@router.post("/", response_model=scheduled_dto.ScheduledTransactionOut)
def create_scheduled_transaction(
    data: scheduled_dto.ScheduledTransactionCreate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    account = db.query(structure.Account).filter(
        structure.Account.id_account == data.Account_id_account
    ).first() # check if account exists and belongs to the user

    if not account or account.User_id_user != current_user.id_user:
        raise HTTPException(status_code=403, detail="Account not accessible or does not exist")

    final_amount = abs(data.amount) # quirk coz user sends amount in positive form (hopefully so we make sure) and we determine if it's income or expense based on the type.
    if data.type == structure.TransactionType.EXPENSE:
        final_amount = -final_amount
    
    new_scheduled = structure.ScheduledTransaction(
        frequency=data.frequency,
        next_date=data.next_date,
        amount=final_amount,
        description=data.description,
        Account_id_account=data.Account_id_account,
        Category_id_category=data.Category_id_category,
        Currency_id_currency=account.Currency_id_currency  
    )
    
    db.add(new_scheduled)
    db.commit()
    db.refresh(new_scheduled)
    return new_scheduled

# Endpoint to get all scheduled transactions of the current user. Returns list of scheduled transactions
@router.get("/", response_model=List[scheduled_dto.ScheduledTransactionOut])
def get_user_scheduled_transactions(
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    results = db.query(structure.ScheduledTransaction).join(
        structure.Account, structure.ScheduledTransaction.Account_id_account == structure.Account.id_account
    ).filter(
        structure.Account.User_id_user == current_user.id_user
    ).all()
    return results
