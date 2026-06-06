from pydantic import BaseModel


class LoginRequest(BaseModel):
    email:    str
    password: str


class RegisterRequest(BaseModel):
    name:     str
    email:    str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class GoogleAuthRequest(BaseModel):
    id_token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token:        str
    new_password: str


def user_to_dict(user: dict, is_paid: bool = False) -> dict:
    """Chuẩn hóa dict user trả về client — dùng chung cho mọi auth endpoint."""
    return {
        "id":      str(user["id"]),
        "name":    user.get("name") or "",
        "email":   user["email"],
        "role":    user.get("role", "student"),
        "is_paid": is_paid,
        "level":   user.get("level"),
        "streak":  user.get("streak", 0),
        "goal":    user.get("goal"),
    }
