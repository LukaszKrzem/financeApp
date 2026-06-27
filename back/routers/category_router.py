import sqlalchemy.orm
from fastapi import APIRouter, Depends

from back import structure
from back.database import get_db

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/")
def get_categories(db: sqlalchemy.orm.Session = Depends(get_db)):
    categories = db.query(structure.Category).all()
    return categories
