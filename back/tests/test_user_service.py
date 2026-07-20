import pytest

from back.dto.user_dto import UserCreate
from back.service import auth_service, user_service


def test_create_user():
    user_data = UserCreate(email="alice@gmail.com", password="1234", name="alice")
    hashed_pwd = auth_service.hash_password(user_data.password)

    new_user = user_service.create_user(user_data, hashed_pwd)

    assert new_user.email == "alice@gmail.com"
    assert new_user.name == "alice"


def test_add_user_success(db_session):
    user_data = UserCreate(email="alice@gmail.com", password="1234", name="alice")
    hashed_pwd = auth_service.hash_password(user_data.password)

    new_user = user_service.create_user(user_data, hashed_pwd)
    result = user_service.add_user(db_session, new_user)

    assert result.name == "alice"
    assert result.email == "alice@gmail.com"


def test_add_user_duplicate(db_session):
    user_data = UserCreate(email="alice@gmail.com", password="1234", name="alice")
    hashed_pwd = auth_service.hash_password(user_data.password)

    user1 = user_service.create_user(user_data, hashed_pwd)
    user2 = user_service.create_user(user_data, hashed_pwd)

    user_service.add_user(db_session, user1)

    with pytest.raises(Exception):
        user_service.add_user(db_session, user2)
