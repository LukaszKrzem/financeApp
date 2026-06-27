from pydantic import BaseModel
from decimal import Decimal


class CurrencyOut(BaseModel):
    id_currency: int
    code: str
    name: str
    exchange_rate: Decimal

    class Config:
        from_attributes = True
