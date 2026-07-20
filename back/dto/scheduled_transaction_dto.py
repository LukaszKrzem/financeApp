import datetime
from decimal import Decimal
from typing import Optional

import pydantic
from pydantic import ConfigDict

from back.structure import TransactionType


class ScheduledTransactionCreate(pydantic.BaseModel):
    frequency: str
    date: datetime.date
    amount: Decimal
    type: TransactionType
    description: Optional[str] = None
    Account_id_account: int
    Category_id_category: int
    Currency_id_currency: int = 1


class ScheduledTransactionOut(pydantic.BaseModel):
    id_schedule_transaction: int
    frequency: str
    next_date: datetime.date
    amount: Decimal
    description: Optional[str]
    Account_id_account: int
    Category_id_category: int
    Currency_id_currency: int = 1

    model_config = ConfigDict(from_attributes=True)


class ScheduledTransactionUpdate(pydantic.BaseModel):
    frequency: Optional[str] = None
    date: Optional[datetime.date] = None
    amount: Optional[Decimal] = None
    type: Optional[TransactionType] = None
    description: Optional[str] = None
    Account_id_account: Optional[int] = None
    Category_id_category: Optional[int] = None
    Currency_id_currency: Optional[int] = None
