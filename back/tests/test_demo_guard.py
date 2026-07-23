import pytest


@pytest.fixture
def demo_auth_headers(client):
    demo_user_data = {
        "email": "demo@demo.com",
        "password": "demopassword123",
        "name": "Demo User",
    }
    client.post("/register", json=demo_user_data)
    login_res = client.post(
        "/login",
        json={"email": "demo@demo.com", "password": "demopassword123"},
    )
    token = login_res.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_demo_user_cannot_delete_account(client, demo_auth_headers, default_currency):
    create_payload = {
        "name": "Demo Bank Account",
        "current_balance": 5000.00,
        "currency_id": 1,
    }
    res = client.post("/accounts/", json=create_payload, headers=demo_auth_headers)
    assert res.status_code == 200
    account_id = res.json()["id_account"]

    del_res = client.delete(f"/accounts/{account_id}", headers=demo_auth_headers)
    assert del_res.status_code == 403
    assert "DEMO MODE: THIS OPERATION IS DISABLED." in del_res.json()["detail"]

    get_res = client.get("/accounts/", headers=demo_auth_headers)
    assert get_res.status_code == 200
    assert any(acc["id_account"] == account_id for acc in get_res.json())


def test_regular_user_can_delete_account(client, auth_headers, default_currency):
    create_payload = {
        "name": "Regular Account",
        "current_balance": 100.00,
        "currency_id": 1,
    }
    res = client.post("/accounts/", json=create_payload, headers=auth_headers)
    assert res.status_code == 200
    account_id = res.json()["id_account"]

    del_res = client.delete(f"/accounts/{account_id}", headers=auth_headers)
    assert del_res.status_code == 204
