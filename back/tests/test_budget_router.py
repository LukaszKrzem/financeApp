import back.structure as structure


def test_budget_crud(client, auth_headers, db_session, default_currency):
    cat = structure.Category(
        name="Food & Dining", type=structure.TransactionType.EXPENSE
    )
    db_session.add(cat)
    db_session.commit()

    # 1. Create Budget
    payload = {
        "limit": 500.0,
        "start_date": "2026-01-01",
        "end": "2026-01-31",
        "category_id": cat.id_category,
        "currency_id": 1,
    }
    response = client.post("/budgets/", json=payload, headers=auth_headers)
    assert response.status_code == 200
    budget = response.json()
    assert float(budget["limit"]) == 500.0
    budget_id = budget["id_budget"]

    # 2. Get Budgets
    response = client.get("/budgets/", headers=auth_headers)
    assert response.status_code == 200
    assert any(b["id_budget"] == budget_id for b in response.json())

    # 3. Update Budget
    update_payload = {
        "limit": 650.0,
        "start_date": "2026-01-01",
        "end": "2026-01-31",
        "category_id": cat.id_category,
        "currency_id": 1,
    }
    response = client.patch(
        f"/budgets/{budget_id}", json=update_payload, headers=auth_headers
    )
    assert response.status_code == 200
    assert float(response.json()["limit"]) == 650.0

    # 4. Delete Budget
    response = client.delete(f"/budgets/{budget_id}", headers=auth_headers)
    assert response.status_code == 204
