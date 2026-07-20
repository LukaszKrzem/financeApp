from datetime import date
from decimal import Decimal
from typing import Optional

import pydantic
from pydantic import ConfigDict


class SavingsGoalCreate(pydantic.BaseModel):
    name: str
    target: Decimal = pydantic.Field(gt=0)
    current_amount: Decimal = pydantic.Field(default=0, ge=0)
    time_limit: Optional[date] = None
    Currency_id_currency: int = 1


class SavingsGoalUpdate(pydantic.BaseModel):
    name: Optional[str] = None
    target: Optional[Decimal] = pydantic.Field(default=None, gt=0)
    current_amount: Optional[Decimal] = pydantic.Field(default=None, ge=0)
    time_limit: Optional[date] = None
    Currency_id_currency: Optional[int] = None


class SavingsGoalContribution(pydantic.BaseModel):
    amount: Decimal = pydantic.Field(gt=0)


class SavingsGoalOut(pydantic.BaseModel):
    id_saving_goal: int
    name: str
    target: Decimal
    current_amount: Decimal
    start_date: date
    time_limit: Optional[date]
    User_id_user: int
    Currency_id_currency: int
    currency_code: str
    percent_complete: float

    model_config = ConfigDict(from_attributes=True)
