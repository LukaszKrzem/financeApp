def test_account_crud(client, auth_headers, default_currency):
    # 1. Create account
    create_payload = {
        "name": "Main Bank Account",
        "current_balance": 1500.50,
        "currency_id": 1,
    }
    response = client.post("/accounts/", json=create_payload, headers=auth_headers)
    assert response.status_code == 200
    account = response.json()
    assert account["name"] == "Main Bank Account"
    assert account["current_balance"] == 1500.50
    account_id = account["id_account"]

    # 2. Get accounts list
    response = client.get("/accounts/", headers=auth_headers)
    assert response.status_code == 200
    accounts = response.json()
    assert any(acc["id_account"] == account_id for acc in accounts)

    # 3. Update account name
    update_payload = {"name": "Updated Bank Account"}
    response = client.patch(
        f"/accounts/{account_id}", json=update_payload, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Bank Account"

    # 4. Delete account
    response = client.delete(f"/accounts/{account_id}", headers=auth_headers)
    assert response.status_code == 204

    # 5. Verify account deleted
    response = client.get("/accounts/", headers=auth_headers)
    assert response.status_code == 200
    assert all(acc["id_account"] != account_id for acc in response.json())
