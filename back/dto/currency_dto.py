from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CurrencyOut(BaseModel):
    id_currency: int
    code: str
    name: str
    exchange_rate: Decimal

    model_config = ConfigDict(from_attributes=True)


class CurrencyRateHistoryOut(BaseModel):
    id_rate_history: int
    currency_id: int
    currency_code: str
    exchange_rate: Decimal
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)
