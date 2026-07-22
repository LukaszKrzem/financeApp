from datetime import datetime
from decimal import Decimal
from typing import Optional

import pydantic
from pydantic import ConfigDict

from back.structure import TransactionType


class TransactionCreate(pydantic.BaseModel):
    amount: Decimal
    date: datetime.date
    description: Optional[str] = None
    type: TransactionType
    account_id: int
    category_id: Optional[int] = None
    currency_id: int = 1


class TransactionUpdate(pydantic.BaseModel):
    amount: Optional[Decimal] = None
    date: Optional[datetime.date] = None
    description: Optional[str] = None
    type: Optional[TransactionType] = None
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    currency_id: Optional[int] = None


class TransactionOut(pydantic.BaseModel):
    id_transaction: int
    amount: Decimal
    date: datetime
    description: Optional[str]
    type: TransactionType
    exchange_rate_snapshot: Decimal
    category_id: Optional[int] = None
    currency_id: Optional[int] = None
    account_id: int

    category_name: Optional[str] = None
    currency_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
