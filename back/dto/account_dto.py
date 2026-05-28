import pydantic

class AccountOut(pydantic.BaseModel):
    id_account: int
    name: str
    current_balance: float

    class Config:
        from_attributes = True

class AccountCreate(pydantic.BaseModel):
    name: str
    current_balance: float
    Currency_id_currency: int