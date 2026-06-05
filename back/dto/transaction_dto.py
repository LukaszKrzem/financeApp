from datetime import datetime
from decimal import Decimal
from typing import Optional

import pydantic

from back.structure import TransactionType


class TransactionCreate(pydantic.BaseModel):
    amount: Decimal
    description: Optional[str] = None
    type: TransactionType
    Account_id_account: int
    Category_id_category: Optional[int] = None


class TransactionOut(pydantic.BaseModel):
    id_transaction: int
    amount: Decimal
    date: datetime
    description: Optional[str]
    type: TransactionType  # Made it TransactionType to avoid confusion and better work with structure
    Account_id_account: int
    category_name: Optional[str] = None
    exchange_rate: float
    currency_code: str

    class Config:
        from_attributes = True
