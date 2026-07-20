from datetime import date, datetime
from decimal import Decimal
from typing import Optional

import pydantic

from back.structure import TransactionType


class TransactionCreate(pydantic.BaseModel):
    amount: Decimal
    date: date
    description: Optional[str] = None
    type: TransactionType
    Account_id_account: int
    Category_id_category: Optional[int] = None
    Currency_id_currency: int = 1


class TransactionUpdate(pydantic.BaseModel):
    amount: Decimal
    date: date
    description: Optional[str] = None
    type: TransactionType
    Account_id_account: int
    Category_id_category: Optional[int] = None
    Currency_id_currency: int = 1


class TransactionOut(pydantic.BaseModel):
    id_transaction: int
    amount: Decimal
    date: datetime
    description: Optional[str]
    type: TransactionType
    Category_id_category: Optional[int] = None
    Currency_id_currency: Optional[int] = None
    Account_id_account: int
    category_name: Optional[str] = None
    exchange_rate: Optional[float] = None
    currency_code: Optional[str] = None

    class Config:
        from_attributes = True
