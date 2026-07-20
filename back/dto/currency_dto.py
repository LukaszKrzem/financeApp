from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CurrencyOut(BaseModel):
    id_currency: int
    code: str
    name: str
    exchange_rate: Decimal

    model_config = ConfigDict(from_attributes=True)
