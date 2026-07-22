import back.structure as structure


def test_scheduled_transaction_crud(client, auth_headers, db_session, default_currency):
    acc_res = client.post(
        "/accounts/",
        json={"name": "Checking", "current_balance": 2000.0, "currency_id": 1},
        headers=auth_headers,
    )
    account_id = acc_res.json()["id_account"]

    cat = structure.Category(name="Streaming", type=structure.TransactionType.EXPENSE)
    db_session.add(cat)
    db_session.commit()

    # 1. Create Scheduled Transaction
    payload = {
        "type": "EXPENSE",
        "frequency": "MONTHLY",
        "date": "2026-08-01",
        "amount": 49.99,
        "description": "Netflix Subscription",
        "account_id": account_id,
        "currency_id": 1,
        "category_id": cat.id_category,
    }
    response = client.post(
        "/scheduled-transactions/", json=payload, headers=auth_headers
    )
    assert response.status_code == 200
    stx = response.json()
    assert float(stx["amount"]) == 49.99
    stx_id = stx["id_schedule_transaction"]

    # 2. Get Scheduled Transactions
    response = client.get("/scheduled-transactions/", headers=auth_headers)
    assert response.status_code == 200
    assert any(s["id_schedule_transaction"] == stx_id for s in response.json())

    # 3. Update Scheduled Transaction
    update_payload = {
        "type": "EXPENSE",
        "frequency": "MONTHLY",
        "date": "2026-08-01",
        "amount": 54.99,
        "description": "Netflix Premium",
        "account_id": account_id,
        "currency_id": 1,
        "category_id": cat.id_category,
    }
    response = client.patch(
        f"/scheduled-transactions/{stx_id}",
        json=update_payload,
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert float(response.json()["amount"]) == 54.99

    # 4. Delete Scheduled Transaction
    response = client.delete(f"/scheduled-transactions/{stx_id}", headers=auth_headers)
    assert response.status_code == 204
