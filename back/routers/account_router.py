from typing import List

import back.dto.account_dto as account_dto
import sqlalchemy.orm
from back.database import get_db
from back.dependencies import get_current_user, prevent_demo_destruction
from back.service import account_service
from fastapi import APIRouter, Depends, status

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("/", response_model=List[account_dto.AccountOut])
def get_user_accounts(
    db: sqlalchemy.orm.Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return account_service.get_user_accounts(db, current_user.id_user)


@router.post("/", response_model=account_dto.AccountOut)
def create_account(
    account_data: account_dto.AccountCreate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return account_service.create_user_account(db, account_data, current_user.id_user)


@router.patch("/{account_id}", response_model=account_dto.AccountOut)
def update_account(
    account_id: int,
    account_data: account_dto.AccountUpdate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return account_service.update_user_account(
        db, account_id, account_data, current_user.id_user
    )


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: int,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(prevent_demo_destruction),
):
    return account_service.delete_user_account(db, account_id, current_user.id_user)
