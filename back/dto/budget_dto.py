from datetime import date
from decimal import Decimal
from typing import Optional

import pydantic
from pydantic import ConfigDict


class BudgetCreate(pydantic.BaseModel):
    limit: Decimal = pydantic.Field(gt=0)  # just assume that budgets must be positive
    start_date: date
    end: date
    category_id: int
    currency_id: int

    # To validate dates corelation
    @pydantic.model_validator(mode="after")
    def validate_dates(self):
        if self.end < self.start_date:
            raise ValueError("End date cannot be earlier than start date!")
        return self


class BudgetUpdate(pydantic.BaseModel):
    limit: Optional[Decimal] = pydantic.Field(default=None, gt=0)
    start_date: Optional[date] = None
    end: Optional[date] = None
    category_id: Optional[int] = None
    currency_id: Optional[int] = None


class BudgetOut(pydantic.BaseModel):
    id_budget: int
    limit: Decimal
    start_date: date
    end: date
    category_id: int
    category_name: str
    currency_id: int
    currency_code: str
    current_spent: Decimal
    percent_used: float

    model_config = ConfigDict(from_attributes=True)
