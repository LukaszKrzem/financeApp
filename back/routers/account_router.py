from fastapi import APIRouter, Depends
import sqlalchemy.orm
import sqlalchemy
from typing import List

import sqlalchemy.orm
from fastapi import APIRouter, Depends

import back.dto.account_dto as account_dto
import back.structure as structure
from back.database import get_db
from back.dependencies import get_current_user

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("/", response_model=List[account_dto.AccountOut])
def get_user_accounts(
    db: sqlalchemy.orm.Session = Depends(get_db), current_user=Depends(get_current_user)
):
    try:
        db.execute(
            sqlalchemy.text("CALL catch_up_scheduled_transactions(:user_id)"),
            {"user_id": current_user.id_user}
        )
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error with starting procedure: {e}")
    results = db.query(structure.Account, structure.Currency).join(
        structure.Currency,
        structure.Account.Currency_id_currency == structure.Currency.id_currency
    ).filter(
        structure.Account.User_id_user == current_user.id_user
    ).all()

    accounts_with_currency = []
    for account, currency in results:
        accounts_with_currency.append(
            {
                "id_account": account.id_account,
                "name": account.name,
                "current_balance": account.current_balance,
                "Currency_id_currency": account.Currency_id_currency,
                "currency_code": currency.code,
            }
        )

    return accounts_with_currency


from fastapi import HTTPException, status


@router.post("/", response_model=account_dto.AccountOut)
def create_account(
    account_data: account_dto.AccountCreate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    currency = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == account_data.Currency_id_currency)
        .first()
    )

    if not currency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Selected currency not found."
        )

    new_account = structure.Account(
        name=account_data.name,
        current_balance=account_data.current_balance,
        Currency_id_currency=account_data.Currency_id_currency,
        User_id_user=current_user.id_user,
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return new_account
