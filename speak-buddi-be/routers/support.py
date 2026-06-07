import logging

from fastapi import APIRouter, Depends, HTTPException

from auth.deps import optional_current_user
from schemas.support import SUBJECT_CHOICES, ContactRequest, ContactResponse
from services.email_service import send_support_contact_email
from utils.validators import validate_email

log = logging.getLogger("speakbuddi.support")

router = APIRouter(prefix="/api/support", tags=["support"])

SUCCESS_MESSAGE = (
    "Yêu cầu của bạn đã được gửi. Chúng tôi sẽ phản hồi qua email trong vòng 24–48 giờ."
)


@router.post("/contact", response_model=ContactResponse)
async def submit_contact(
    req: ContactRequest,
    user: dict | None = Depends(optional_current_user),
):
    # Honeypot — bot điền field ẩn → noop, không gửi mail
    if req.website and req.website.strip():
        log.info("SUPPORT_CONTACT honeypot")
        return ContactResponse(message=SUCCESS_MESSAGE)

    name = req.name.strip()
    email = req.email.strip().lower()
    message = req.message.strip()
    subject = req.subject.strip().lower()

    if not name:
        raise HTTPException(status_code=400, detail="Vui lòng nhập họ tên.")
    if not email:
        raise HTTPException(status_code=400, detail="Vui lòng nhập email.")
    if not validate_email(email):
        raise HTTPException(status_code=400, detail="Email không hợp lệ.")
    if subject not in SUBJECT_CHOICES:
        raise HTTPException(status_code=400, detail="Vui lòng chọn chủ đề hợp lệ.")
    if not message:
        raise HTTPException(status_code=400, detail="Vui lòng nhập nội dung tin nhắn.")

    user_id = str(user["sub"]) if user and user.get("sub") else None

    try:
        status = send_support_contact_email(
            sender_name=name,
            sender_email=email,
            subject_key=subject,
            message=message,
            user_id=user_id,
        )
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Không gửi được yêu cầu lúc này. Vui lòng thử lại sau.",
        ) from None

    if status == "sent":
        log.info("SUPPORT_CONTACT ok")
    else:
        log.warning("SUPPORT_CONTACT skip")

    return ContactResponse(message=SUCCESS_MESSAGE)
