def test_notification_crud(client, auth_headers):
    # 1. Get Notifications
    response = client.get("/notifications/", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
