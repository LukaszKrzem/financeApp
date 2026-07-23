import logging
import os
import uuid

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException
from sqlalchemy.orm import Session

from back.structure import Feedback

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def generate_presigned_url(file_type: str) -> dict:
    if file_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Allowed formats: JPG, PNG, WEBP.",
        )

    region = os.getenv("AWS_REGION")
    bucket_name = os.getenv("AWS_BUCKET_NAME")
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

    if not region or not bucket_name or not access_key or not secret_key:
        raise HTTPException(
            status_code=500,
            detail="S3 storage credentials are not properly configured.",
        )

    extension = ALLOWED_MIME_TYPES[file_type]
    file_name = f"feedbacks/{uuid.uuid4()}.{extension}"

    endpoint_url = os.getenv("AWS_ENDPOINT_URL")
    public_prefix = os.getenv("AWS_PUBLIC_URL_PREFIX")

    try:
        s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )

        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": bucket_name,
                "Key": file_name,
                "ContentType": file_type,
            },
            ExpiresIn=300,
        )

        if public_prefix:
            clean_prefix = public_prefix.rstrip("/")
            file_url = f"{clean_prefix}/{file_name}"
        elif endpoint_url:
            file_url = f"{endpoint_url.rstrip('/')}/{bucket_name}/{file_name}"
        else:
            file_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{file_name}"

        return {
            "upload_url": presigned_url,
            "file_url": file_url,
        }
    except ClientError as e:
        logger.error(f"S3 presigned URL generation failed: {e}")
        raise HTTPException(
            status_code=500, detail="Could not generate file upload URL."
        )


def process_feedback(
    db: Session, message: str, screenshot: str | None, user_id: int
) -> dict:
    try:
        feedback_entry = Feedback(
            user_id=user_id,
            message=message,
            screenshot_url=screenshot,
        )
        db.add(feedback_entry)
        db.commit()
        db.refresh(feedback_entry)

        logger.info(
            "Saved feedback id=%s from user_id=%s",
            feedback_entry.id_feedback,
            user_id,
        )
        return {
            "status": "success",
            "message": "Feedback submitted successfully.",
            "id_feedback": feedback_entry.id_feedback,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save feedback in database: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to save feedback in database. Please check server logs.",
        )
