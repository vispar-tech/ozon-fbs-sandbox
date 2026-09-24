"""Base for web DTO models."""

from pydantic import BaseModel, ConfigDict


class ApiModel(BaseModel):
    """Base for web DTOs: snake_case fields."""

    model_config = ConfigDict(from_attributes=True)
