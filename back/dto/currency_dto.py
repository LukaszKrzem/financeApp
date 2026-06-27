from decimal import Decimal

from pydantic import BaseModel


class CurrencyOut(BaseModel):
    id_currency: int
    code: str
    name: str
    exchange_rate: Decimal

    class Config:
        from_attributes = True
