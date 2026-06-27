from datetime import date
from decimal import Decimal

import pydantic


class BudgetCreate(pydantic.BaseModel):
    limit: Decimal = pydantic.Field(gt=0)  # just assume that budgets must be positive
    start_date: date
    end: date
    Categories_id_category: int
    Currency_id_currency: int

    # To validate dates corelation
    @pydantic.model_validator(mode="after")
    def validate_dates(self):
        if self.end < self.start_date:
            raise ValueError(
                "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia!"
            )
        return self


class BudgetOut(pydantic.BaseModel):
    id_budget: int
    limit: Decimal
    start_date: date
    end: date
    categories_id_category: int
    category_name: str
    currency_id_currency: int
    currency_code: str
    current_spent: Decimal
    percent_used: float

    class Config:
        from_attributes = True
