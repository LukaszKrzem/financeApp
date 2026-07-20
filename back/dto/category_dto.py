from pydantic import BaseModel, ConfigDict

from back.structure import TransactionType


class CategoryOut(BaseModel):
    id_category: int
    name: str
    type: TransactionType

    model_config = ConfigDict(from_attributes=True)
