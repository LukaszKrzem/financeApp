from typing import List
import sqlalchemy.orm
from fastapi import APIRouter, Depends

from back.database import get_db
import back.structure as structure
import back.dto.currency_dto as currency_dto

router = APIRouter(prefix="/currencies", tags=["Currencies"])

@router.get("/", response_model=List[currency_dto.CurrencyOut])
def get_all_currencies(db: sqlalchemy.orm.Session = Depends(get_db)):
    currencies = db.query(structure.Currency).all()
    return [currency_dto.CurrencyOut.model_validate(currency) for currency in currencies]