from typing import List

import back.dto.scheduled_transaction_dto as scheduled_dto
import back.service.scheduled_transaction_service as scheduled_service
import sqlalchemy.orm
from back.database import get_db
from back.dependencies import get_current_user
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/scheduled-transactions", tags=["Scheduled Transactions"])


@router.post("/", response_model=scheduled_dto.ScheduledTransactionOut)
def create_scheduled_transaction(
    data: scheduled_dto.ScheduledTransactionCreate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return scheduled_service.create_scheduled_transaction(
        db, data, current_user.id_user
    )


@router.get("/", response_model=List[scheduled_dto.ScheduledTransactionOut])
def get_user_scheduled_transactions(
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return scheduled_service.get_user_scheduled_transactions(db, current_user.id_user)
