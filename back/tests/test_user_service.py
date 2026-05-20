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

