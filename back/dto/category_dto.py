from pydantic import BaseModel

from back.structure import TransactionType


class CategoryOut(BaseModel):
    id_category: int
    name: str
    type: TransactionType

    class Config:
        from_attributes = True
