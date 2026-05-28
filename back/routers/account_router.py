from fastapi import APIRouter, Depends
import sqlalchemy.orm
from typing import List

from back.database import get_db
from back.dependencies import get_current_user
import back.structure as structure
import back.dto.account_dto as account_dto

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.get("/", response_model=List[account_dto.AccountOut])
def get_user_accounts(
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    accounts = db.query(structure.Account).filter(
        structure.Account.User_id_user == current_user.id_user
    ).all()

    return accounts

from fastapi import HTTPException, status

@router.post("/", response_model=account_dto.AccountOut)
def create_account(
    account_data: account_dto.AccountCreate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    currency = db.query(structure.Currency).filter(
        structure.Currency.id_currency == account_data.Currency_id_currency
    ).first()

    if not currency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selected currency not found."
        )

    new_account = structure.Account(
        name=account_data.name,
        current_balance=account_data.current_balance,
        Currency_id_currency=account_data.Currency_id_currency,
        User_id_user=current_user.id_user
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return new_account