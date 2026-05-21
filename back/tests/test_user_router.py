def test_register_success(client):
    response = client.post("/register", json={
        "email": "alice@gmail.com",
        "password": "1234",
        "name": "alice"
    })

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@gmail.com"


def test_register_duplicate(client):
    response = client.post("/register", json={
        "email": "alice@gmail.com",
        "password": "1234",
        "name": "alice"
    })

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@gmail.com"

    response_duplicated_user = client.post("/register", json={
        "email": "alice@gmail.com",
        "password": "1234",
        "name": "alice"
    })

    assert response_duplicated_user.status_code == 400

    data = response_duplicated_user.json()
    assert "access_token" not in data


def test_login_success(client):
    response = client.post("/register", json={
        "email": "alice@gmail.com",
        "password": "1234",
        "name": "alice"
    })

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@gmail.com"

    response = client.post("/login", json={
        "email": "alice@gmail.com",
        "password": "1234",
    })

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["name"] == "alice"


def test_login_unregistered_user(client):
    response = client.post("/login", json={
        "email": "alice@gmail.com",
        "password": "1234",
    })

    assert response.status_code == 403

    data = response.json()
    assert "access_token" not in data


def test_login_wrong_credentials(client):
    response = client.post("/register", json={
        "email": "alice@gmail.com",
        "password": "1234",
        "name": "alice"
    })

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@gmail.com"

    response = client.post("/login", json={
        "email": "alice@gmail.com",
        "password": "wrong_password",
    })

    assert response.status_code == 403

    data = response.json()
    assert "access_token" not in data


def test_get_me_logged_user(client):
    # register
    response = client.post("/register", json={
        "email": "alice@gmail.com",
        "password": "1234",
        "name": "alice"
    })

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@gmail.com"

    # log in
    response = client.post("/login", json={
        "email": "alice@gmail.com",
        "password": "1234",
    })

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["name"] == "alice"

    token = data["access_token"]

    # get_me
    response = client.get("/me", headers={
        "Authorization": f"Bearer {token}"
    })

    assert response.status_code == 200


def test_get_me_unauthorised_user(client):
    # register
    response = client.post("/register", json={
        "email": "alice@gmail.com",
        "password": "1234",
        "name": "alice"
    })

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@gmail.com"


    # get_me
    response = client.get("/me", headers={
        "Authorization": f"Bearer {"wrong_token"}"
    })

    assert response.status_code == 401