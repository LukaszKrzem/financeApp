import sqlalchemy.exc
import sqlalchemy.orm
from fastapi import HTTPException

import back.dto.user_dto
import back.structure
from back.service import auth_service


# Used in registration and login
def get_user_by_email(db: sqlalchemy.orm.Session, email: str):
    return (
        db.query(back.structure.User).filter(back.structure.User.email == email).first()
    )


# Used in registration to create a new user
def create_user(user_data: back.dto.user_dto.UserCreate):
    hashed_pwd = auth_service.hash_password(user_data.password)
    new_user = back.structure.User(
        email=user_data.email, password=hashed_pwd, name=user_data.name
    )
    return new_user


def add_user(db: sqlalchemy.orm.Session, new_user: back.structure.User):
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except sqlalchemy.exc.SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Database error while creating user"
        )
