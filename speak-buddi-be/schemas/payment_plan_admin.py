# speak-buddi-be/schemas/payment_plan_admin.py
# ─── Pydantic schemas cho Admin CRUD payment_plan (S10.1) ────────────────────
# Tách khỏi schemas/payment.py (checkout/pricing public).

from datetime import datetime

from pydantic import BaseModel, Field


class PaymentPlanCreate(BaseModel):
    name: str
    price_vnd: int = Field(ge=0)
    duration_days: int = Field(default=0, ge=0)
    description: str | None = None
    features: list[str]
    sort_order: int = 0


class PaymentPlanUpdate(BaseModel):
    name: str | None = None
    price_vnd: int | None = Field(default=None, ge=0)
    duration_days: int | None = Field(default=None, ge=0)
    description: str | None = None
    features: list[str] | None = None
    sort_order: int | None = None
    is_active: bool | None = None  # S10.2 soft delete — optional, không dùng UI S10.1


class PaymentPlanAdminOut(BaseModel):
    id: str
    name: str
    price_vnd: int
    duration_days: int
    description: str | None = None
    features: list[str]
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime
