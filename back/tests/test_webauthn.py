import back.structure as structure


def test_get_register_options(client, auth_headers):
    response = client.post("/auth/webauthn/register/options", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "challenge" in data
    assert "rp" in data
    assert data["rp"]["name"] == "Finance App"


def test_get_login_options_nonexistent_user(client):
    response = client.post(
        "/auth/webauthn/login/options",
        json={"email": "nonexistent@example.com"},
    )
    assert response.status_code == 404


def test_get_login_options_no_credentials(client, auth_headers):
    response = client.post(
        "/auth/webauthn/login/options",
        json={"email": "testuser@example.com"},
    )
    assert response.status_code == 400
    assert "No registered biometric devices" in response.json()["detail"]


def test_list_and_delete_credentials(client, auth_headers, db_session):
    user = (
        db_session.query(structure.User)
        .filter(structure.User.email == "testuser@example.com")
        .first()
    )

    cred = structure.WebAuthnCredential(
        user_id=user.id_user,
        credential_id="test_cred_id_123",
        public_key="test_public_key_abc",
        sign_count=0,
        device_name="Test Device",
    )
    db_session.add(cred)
    db_session.commit()
    db_session.refresh(cred)

    # Test list credentials
    list_res = client.get("/auth/webauthn/credentials", headers=auth_headers)
    assert list_res.status_code == 200
    cred_list = list_res.json()
    assert len(cred_list) == 1
    assert cred_list[0]["device_name"] == "Test Device"
    assert cred_list[0]["id_credential"] == cred.id_credential

    # Test get login options when credentials exist
    login_opt_res = client.post(
        "/auth/webauthn/login/options",
        json={"email": "testuser@example.com"},
    )
    assert login_opt_res.status_code == 200
    assert "challenge" in login_opt_res.json()

    # Test delete credential
    del_res = client.delete(
        f"/auth/webauthn/credentials/{cred.id_credential}",
        headers=auth_headers,
    )
    assert del_res.status_code == 204

    # Verify deleted
    list_after_del = client.get("/auth/webauthn/credentials", headers=auth_headers)
    assert list_after_del.status_code == 200
    assert len(list_after_del.json()) == 0


def test_delete_nonexistent_credential(client, auth_headers):
    del_res = client.delete(
        "/auth/webauthn/credentials/99999",
        headers=auth_headers,
    )
    assert del_res.status_code == 404
