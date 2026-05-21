import pytest
from back.service import user_service
from back.dto.user_dto import UserCreate


def test_create_user():
    user_data = UserCreate(
        email="alice@gmail.com",
        password="1234",
        name="alice"
    )

    new_user = user_service.create_user(user_data)
    
    assert new_user.email == "alice@gmail.com"
    assert new_user.name == "alice"


def test_add_user_success(db_session):
    user_data = UserCreate(
        email="alice@gmail.com",
        password="1234",
        name="alice"
    )

    new_user = user_service.create_user(user_data)
    result = user_service.add_user(db_session, new_user)

    assert result.name == "alice"
    assert result.email == "alice@gmail.com"


def test_add_user_duplicate(db_session):
    user_data = UserCreate(
        email="alice@gmail.com",
        password="1234",
        name="alice"
    )

    user1 = user_service.create_user(user_data)
    user2 = user_service.create_user(user_data)

    user_service.add_user(db_session, user1)
    
    with pytest.raises(Exception):
        user_service.add_user(db_session, user2)

    