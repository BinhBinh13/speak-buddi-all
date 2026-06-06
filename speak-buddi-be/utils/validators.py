import re

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(email: str) -> bool:
    return bool(_EMAIL_RE.match(email))


def validate_password(pw: str) -> bool:
    return len(pw) >= 8 and any(c.isdigit() for c in pw)
