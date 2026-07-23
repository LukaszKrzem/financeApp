from unittest.mock import MagicMock, patch

import pytest

from back.structure import Feedback

TEST_USER = {"email": "help_user@gmail.com", "password": "1234", "name": "HelpUser"}
LOGIN_CREDS = {"email": "help_user@gmail.com", "password": "1234"}


@pytest.fixture
def auth_header(client):
    client.post("/register", json=TEST_USER)
    res = client.post("/login", json=LOGIN_CREDS)
    token = res.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_presigned_url_unauthorized(client):
    response = client.get("/help/presigned-url?file_type=image/png")
    assert response.status_code == 401


def test_get_presigned_url_invalid_file_type(client, auth_header):
    response = client.get(
        "/help/presigned-url?file_type=application/exe", headers=auth_header
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


@patch.dict(
    "os.environ",
    {
        "AWS_REGION": "eu-central-1",
        "AWS_BUCKET_NAME": "test-bucket",
        "AWS_ACCESS_KEY_ID": "test-key",
        "AWS_SECRET_ACCESS_KEY": "test-secret",
        "AWS_ENDPOINT_URL": "",
        "AWS_PUBLIC_URL_PREFIX": "",
    },
)
@patch("boto3.client")
def test_get_presigned_url_success(mock_boto_client, client, auth_header):
    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = "https://test-bucket.s3.eu-central-1.amazonaws.com/feedbacks/fake.png?presigned=true"
    mock_boto_client.return_value = mock_s3

    response = client.get(
        "/help/presigned-url?file_type=image/png", headers=auth_header
    )
    assert response.status_code == 200
    data = response.json()
    assert "upload_url" in data
    assert "file_url" in data
    assert data["file_url"].startswith(
        "https://test-bucket.s3.eu-central-1.amazonaws.com/feedbacks/"
    )


@patch.dict(
    "os.environ",
    {
        "AWS_REGION": "eu-central-1",
        "AWS_BUCKET_NAME": "feedbacks",
        "AWS_ACCESS_KEY_ID": "test-key",
        "AWS_SECRET_ACCESS_KEY": "test-secret",
        "AWS_ENDPOINT_URL": "https://yzyhgjbohkqiljpsxivm.supabase.co/storage/v1/s3",
        "AWS_PUBLIC_URL_PREFIX": "https://yzyhgjbohkqiljpsxivm.supabase.co/storage/v1/object/public/feedbacks",
    },
)
@patch("boto3.client")
def test_get_presigned_url_supabase_custom_endpoint(
    mock_boto_client, client, auth_header
):
    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = (
        "https://yzyhgjbohkqiljpsxivm.supabase.co/storage/v1/s3/feedbacks/fake.png"
    )
    mock_boto_client.return_value = mock_s3

    response = client.get(
        "/help/presigned-url?file_type=image/png", headers=auth_header
    )
    assert response.status_code == 200
    data = response.json()
    assert "upload_url" in data
    assert "file_url" in data
    assert data["file_url"].startswith(
        "https://yzyhgjbohkqiljpsxivm.supabase.co/storage/v1/object/public/feedbacks/feedbacks/"
    )


def test_submit_feedback_success(client, auth_header, db_session):
    response = client.post(
        "/help/feedback",
        json={
            "message": "Great app! Found a small UI bug.",
            "screenshot": "https://test-bucket.s3.eu-central-1.amazonaws.com/feedbacks/sample.png",
        },
        headers=auth_header,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "id_feedback" in data

    feedback_db = (
        db_session.query(Feedback).filter_by(id_feedback=data["id_feedback"]).first()
    )
    assert feedback_db is not None
    assert feedback_db.message == "Great app! Found a small UI bug."
    assert (
        feedback_db.screenshot_url
        == "https://test-bucket.s3.eu-central-1.amazonaws.com/feedbacks/sample.png"
    )
