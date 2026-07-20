from typing import List

import back.dto.category_dto as category_dto
import back.service.category_service as category_service
import sqlalchemy.orm
from back.database import get_db
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=List[category_dto.CategoryOut])
def get_categories(db: sqlalchemy.orm.Session = Depends(get_db)):
    return category_service.get_all_categories(db)
