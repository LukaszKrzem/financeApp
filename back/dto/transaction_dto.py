import pydantic
from datetime import datetime
from typing import Optional
from back.structure import TransactionType
from decimal import Decimal

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
    type: TransactionType
    Account_id_account: int

    class Config:
        from_attributes = True