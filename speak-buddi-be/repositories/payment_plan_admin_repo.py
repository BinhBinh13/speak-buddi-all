# speak-buddi-be/repositories/payment_plan_admin_repo.py
# ─── Admin CRUD payment_plan (S10.1) ─────────────────────────────────────────
# Pattern: raw SQL qua sqlalchemy.text() — bám payment_repo.py / content_repo.py

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def _normalize_features(features: list[str] | None) -> list[str]:
    if not features:
        return []
    return [f.strip() for f in features if f and f.strip()]


async def list_plans(
    db: AsyncSession,
    include_inactive: bool = True,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """Danh sách gói cho Admin — phân trang; status: active|inactive|all."""
    conditions: list[str] = []
    if status == "inactive":
        conditions.append("is_active = FALSE")
    elif status == "active":
        conditions.append("is_active = TRUE")
    elif not include_inactive:
        conditions.append("is_active = TRUE")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    params = {"limit": limit, "offset": offset}

    count_r = await db.execute(text(f"SELECT COUNT(*) FROM payment_plan {where_clause}"), params)
    total = count_r.scalar() or 0

    r = await db.execute(
        text(f"""
            SELECT id::text,
                   name,
                   price_vnd,
                   duration_days,
                   description,
                   features,
                   is_active,
                   sort_order,
                   created_at,
                   updated_at
            FROM   payment_plan
            {where_clause}
            ORDER  BY sort_order ASC, created_at ASC
            LIMIT  :limit OFFSET :offset
        """),
        params,
    )
    rows = []
    for row in r.mappings().all():
        d = dict(row)
        d["features"] = list(d.get("features") or [])
        rows.append(d)
    return rows, total


async def get_plan(db: AsyncSession, plan_id: str) -> dict | None:
    r = await db.execute(
        text("""
            SELECT id::text,
                   name,
                   price_vnd,
                   duration_days,
                   description,
                   features,
                   is_active,
                   sort_order,
                   created_at,
                   updated_at
            FROM   payment_plan
            WHERE  id = CAST(:plan_id AS UUID)
        """),
        {"plan_id": plan_id},
    )
    row = r.mappings().first()
    if not row:
        return None
    d = dict(row)
    d["features"] = list(d.get("features") or [])
    return d


async def create_plan(db: AsyncSession, data: dict) -> dict:
    features = _normalize_features(data.get("features"))
    r = await db.execute(
        text("""
            INSERT INTO payment_plan (
                name, price_vnd, duration_days, description, features, sort_order
            ) VALUES (
                :name, :price_vnd, :duration_days, :description, :features, :sort_order
            )
            RETURNING id::text,
                      name,
                      price_vnd,
                      duration_days,
                      description,
                      features,
                      is_active,
                      sort_order,
                      created_at,
                      updated_at
        """),
        {
            "name": data["name"],
            "price_vnd": data["price_vnd"],
            "duration_days": data.get("duration_days", 0),
            "description": data.get("description"),
            "features": features,
            "sort_order": data.get("sort_order", 0),
        },
    )
    row = r.mappings().first()
    d = dict(row)
    d["features"] = list(d.get("features") or [])
    await db.commit()
    return d


async def update_plan(db: AsyncSession, plan_id: str, data: dict) -> dict | None:
    existing = await get_plan(db, plan_id)
    if not existing:
        return None

    fields: list[str] = []
    params: dict = {"plan_id": plan_id}

    if "name" in data:
        fields.append("name = :name")
        params["name"] = data["name"]
    if "price_vnd" in data:
        fields.append("price_vnd = :price_vnd")
        params["price_vnd"] = data["price_vnd"]
    if "duration_days" in data:
        fields.append("duration_days = :duration_days")
        params["duration_days"] = data["duration_days"]
    if "description" in data:
        fields.append("description = :description")
        params["description"] = data["description"]
    if "features" in data:
        fields.append("features = :features")
        params["features"] = _normalize_features(data["features"])
    if "sort_order" in data:
        fields.append("sort_order = :sort_order")
        params["sort_order"] = data["sort_order"]
    if "is_active" in data:
        fields.append("is_active = :is_active")
        params["is_active"] = data["is_active"]

    if not fields:
        return existing

    fields.append("updated_at = NOW()")
    set_clause = ", ".join(fields)

    r = await db.execute(
        text(f"""
            UPDATE payment_plan
            SET    {set_clause}
            WHERE  id = CAST(:plan_id AS UUID)
            RETURNING id::text,
                      name,
                      price_vnd,
                      duration_days,
                      description,
                      features,
                      is_active,
                      sort_order,
                      created_at,
                      updated_at
        """),
        params,
    )
    row = r.mappings().first()
    d = dict(row)
    d["features"] = list(d.get("features") or [])
    await db.commit()
    return d


async def soft_delete_plan(db: AsyncSession, plan_id: str) -> bool:
    """Soft-delete payment_plan (S10.2 — AC-14-03). Router gọi commit."""
    r = await db.execute(
        text("""
            UPDATE payment_plan
            SET    is_active = FALSE,
                   updated_at = NOW()
            WHERE  id = CAST(:plan_id AS UUID)
        """),
        {"plan_id": plan_id},
    )
    return r.rowcount > 0
