from datetime import date
from decimal import Decimal
from typing import Optional

import pydantic

from back.structure import TransactionType


class ScheduledTransactionCreate(pydantic.BaseModel):
    frequency: str
    date: date
    amount: Decimal
    type: TransactionType
    description: Optional[str] = None
    Account_id_account: int
    Category_id_category: int
    Currency_id_currency: int = 1


class ScheduledTransactionOut(pydantic.BaseModel):
    id_schedule_transaction: int
    frequency: str
    next_date: date
    amount: Decimal
    description: Optional[str]
    Account_id_account: int
    Category_id_category: int

    class Config:
        from_attributes = True
