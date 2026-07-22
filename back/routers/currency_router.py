from typing import List

import back.dto.currency_dto as currency_dto
import back.service.currency_service as currency_service
import sqlalchemy.orm
from back.database import get_db
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/currencies", tags=["Currencies"])


@router.get("/", response_model=List[currency_dto.CurrencyOut])
def get_all_currencies(db: sqlalchemy.orm.Session = Depends(get_db)):
    return currency_service.get_all_currencies(db)


@router.get("/history", response_model=List[currency_dto.CurrencyRateHistoryOut])
def get_currency_rate_history(
    code: str = None, db: sqlalchemy.orm.Session = Depends(get_db)
):
    return currency_service.get_currency_rate_history(db, currency_code=code)
