import sqlalchemy.orm
from back import structure
from back.database import get_db
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/")
def get_categories(db: sqlalchemy.orm.Session = Depends(get_db)):
    categories = db.query(structure.Category).all()
    return categories
