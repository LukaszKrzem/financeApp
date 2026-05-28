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