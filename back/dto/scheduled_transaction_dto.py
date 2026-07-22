import datetime
from decimal import Decimal
from typing import Optional

import pydantic
from pydantic import ConfigDict

from back.structure import ScheduleFrequency, TransactionType


class ScheduledTransactionCreate(pydantic.BaseModel):
    frequency: ScheduleFrequency
    date: datetime.date
    amount: Decimal
    type: TransactionType
    description: Optional[str] = None
    account_id: int
    category_id: Optional[int] = None
    currency_id: int = 1


class ScheduledTransactionOut(pydantic.BaseModel):
    id_schedule_transaction: int
    type: TransactionType
    frequency: ScheduleFrequency
    next_date: datetime.date
    amount: Decimal
    description: Optional[str]
    exchange_rate_snapshot: Decimal
    account_id: int
    category_id: Optional[int]
    currency_id: int

    account_name: Optional[str] = None
    category_name: Optional[str] = None
    currency_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ScheduledTransactionUpdate(pydantic.BaseModel):
    frequency: Optional[ScheduleFrequency] = None
    date: Optional[datetime.date] = None
    amount: Optional[Decimal] = None
    type: Optional[TransactionType] = None
    description: Optional[str] = None
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    currency_id: Optional[int] = None
