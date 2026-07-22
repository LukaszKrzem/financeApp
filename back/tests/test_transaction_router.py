import back.structure as structure


def test_transaction_crud(client, auth_headers, db_session, default_currency):
    # Setup Account & Category
    acc_res = client.post(
        "/accounts/",
        json={"name": "Checking", "current_balance": 2000.0, "currency_id": 1},
        headers=auth_headers,
    )
    account_id = acc_res.json()["id_account"]

    cat = structure.Category(name="Coffee", type=structure.TransactionType.EXPENSE)
    db_session.add(cat)
    db_session.commit()

    # 1. Create Transaction
    payload = {
        "type": "EXPENSE",
        "amount": 15.50,
        "date": "2026-01-15",
        "description": "Morning Espresso",
        "account_id": account_id,
        "currency_id": 1,
        "category_id": cat.id_category,
    }
    response = client.post("/transactions/", json=payload, headers=auth_headers)
    assert response.status_code == 200
    tx = response.json()
    assert float(tx["amount"]) == 15.50
    tx_id = tx["id_transaction"]

    # 2. Get Transactions
    response = client.get("/transactions/", headers=auth_headers)
    assert response.status_code == 200
    assert any(t["id_transaction"] == tx_id for t in response.json())

    # 3. Update Transaction
    update_payload = {
        "type": "EXPENSE",
        "amount": 18.00,
        "date": "2026-01-15",
        "description": "Double Espresso",
        "account_id": account_id,
        "currency_id": 1,
        "category_id": cat.id_category,
    }
    response = client.put(
        f"/transactions/{tx_id}", json=update_payload, headers=auth_headers
    )
    assert response.status_code == 200
    assert float(response.json()["amount"]) == 18.00

    # 4. Delete Transaction
    response = client.delete(f"/transactions/{tx_id}", headers=auth_headers)
    assert response.status_code == 204
