from typing import List

import back.dto.transaction_dto as transaction_dto
import back.service.transaction_service as transaction_service
import sqlalchemy.orm
from back.database import get_db
from back.dependencies import get_current_user
from fastapi import APIRouter, Depends, status

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/", response_model=transaction_dto.TransactionOut)
def create_transaction(
    transaction_data: transaction_dto.TransactionCreate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return transaction_service.create_user_transaction(
        db, transaction_data, current_user.id_user
    )


@router.get("/", response_model=List[transaction_dto.TransactionOut])
def get_user_transactions(
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return transaction_service.get_user_transactions(db, current_user.id_user)


@router.put("/{transaction_id}", response_model=transaction_dto.TransactionOut)
def update_transaction(
    transaction_id: int,
    transaction_data: transaction_dto.TransactionUpdate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return transaction_service.update_user_transaction(
        db, transaction_id, transaction_data, current_user.id_user
    )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    transaction_service.delete_user_transaction(
        db, transaction_id, current_user.id_user
    )
    return None
