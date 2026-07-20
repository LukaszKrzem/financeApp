import pytest

TEST_USER = {"email": "alice@gmail.com", "password": "1234", "name": "alice"}
LOGIN_CREDS = {"email": "alice@gmail.com", "password": "1234"}


@pytest.fixture
def registered_user_token(client):
    """Fixture that registers and logs in a user, returning a ready token."""
    client.post("/register", json=TEST_USER)
    response = client.post("/login", json=LOGIN_CREDS)
    return response.json()["token"]


def test_register_success(client):
    response = client.post("/register", json=TEST_USER)

    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == TEST_USER["email"]


def test_register_duplicate(client):
    client.post("/register", json=TEST_USER)

    response = client.post("/register", json=TEST_USER)
    assert response.status_code == 400
    assert "token" not in response.json()


def test_login_success(client):
    client.post("/register", json=TEST_USER)

    response = client.post("/login", json=LOGIN_CREDS)
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["name"] == TEST_USER["name"]


def test_login_unregistered_user(client):
    response = client.post("/login", json=LOGIN_CREDS)

    assert response.status_code == 401
    assert "token" not in response.json()


def test_login_wrong_credentials(client):
    client.post("/register", json=TEST_USER)

    response = client.post(
        "/login",
        json={"email": TEST_USER["email"], "password": "wrong_password"},
    )

    assert response.status_code == 401
    assert "token" not in response.json()


def test_get_me_logged_user(client, registered_user_token):
    response = client.get(
        "/me", headers={"Authorization": f"Bearer {registered_user_token}"}
    )

    assert response.status_code == 200


def test_get_me_unauthorised_user(client):
    response = client.get(
        "/me", headers={"Authorization": "Bearer totally_wrong_token"}
    )

    assert response.status_code == 401
