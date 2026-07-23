from typing import Optional

from pydantic import BaseModel, Field


class FeedbackCreateDTO(BaseModel):
    message: str = Field(..., min_length=1, description="Message content")
    screenshot: Optional[str] = Field(
        None, description="URL of uploaded screenshot image"
    )
