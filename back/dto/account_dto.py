import pydantic

class AccountOut(pydantic.BaseModel):
    id_account: int
    name: str
    current_balance: float
    Currency_id_currency: int
    currency_code: str

    class Config:
        from_attributes = True

class AccountCreate(pydantic.BaseModel):
    name: str
    current_balance: float
    Currency_id_currency: int