def test_savings_goal_crud(client, auth_headers, default_currency):
    # 1. Create Savings Goal
    payload = {
        "name": "New Car Fund",
        "target": 10000.0,
        "current_amount": 1000.0,
        "time_limit": "2026-12-31",
        "currency_id": 1,
    }
    response = client.post("/savings-goals/", json=payload, headers=auth_headers)
    assert response.status_code == 200
    goal = response.json()
    assert goal["name"] == "New Car Fund"
    goal_id = goal["id_saving_goal"]

    # 2. Get Savings Goals
    response = client.get("/savings-goals/", headers=auth_headers)
    assert response.status_code == 200
    assert any(g["id_saving_goal"] == goal_id for g in response.json())

    # 3. Add contribution
    add_payload = {"amount": 500.0}
    response = client.patch(
        f"/savings-goals/{goal_id}/add", json=add_payload, headers=auth_headers
    )
    assert response.status_code == 200
    assert float(response.json()["current_amount"]) == 1500.0

    # 4. Update Savings Goal
    update_payload = {
        "name": "Dream Car Fund",
        "target": 12000.0,
        "current_amount": 1500.0,
        "time_limit": "2027-06-30",
        "currency_id": 1,
    }
    response = client.patch(
        f"/savings-goals/{goal_id}", json=update_payload, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Dream Car Fund"

    # 5. Delete Savings Goal
    response = client.delete(f"/savings-goals/{goal_id}", headers=auth_headers)
    assert response.status_code == 204
