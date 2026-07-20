import sqlalchemy.exc
import sqlalchemy.orm
from fastapi import HTTPException, status

import back.dto.user_dto
import back.structure


def get_user_by_email(db: sqlalchemy.orm.Session, email: str):
    return (
        db.query(back.structure.User).filter(back.structure.User.email == email).first()
    )


def create_user(user_data: back.dto.user_dto.UserCreate, hashed_password: str):
    new_user = back.structure.User(
        email=user_data.email, password=hashed_password, name=user_data.name
    )
    return new_user


def add_user(db: sqlalchemy.orm.Session, new_user: back.structure.User):
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except sqlalchemy.exc.IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )
    except sqlalchemy.exc.SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while creating user",
        )
