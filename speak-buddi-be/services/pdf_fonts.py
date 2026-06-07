# speak-buddi-be/services/pdf_fonts.py
# ─── Đăng ký font Unicode cho PDF export (tiếng Việt + ₫) ───────────────────

from __future__ import annotations

import logging
import sys
from pathlib import Path

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

log = logging.getLogger(__name__)

FONT_REGULAR = "SpeakBuddiPDF"
FONT_BOLD = "SpeakBuddiPDF-Bold"

_REGISTERED = False


def _font_roboto_paths() -> tuple[Path, Path] | None:
    try:
        import font_roboto
    except ImportError:
        return None
    root = Path(list(font_roboto.__path__)[0]) / "files"
    regular = root / "Roboto-Regular.ttf"
    bold = root / "Roboto-Bold.ttf"
    if regular.is_file() and bold.is_file():
        return regular, bold
    return None


def _candidate_pairs() -> list[tuple[Path, Path]]:
    be_root = Path(__file__).resolve().parent.parent
    assets = be_root / "assets" / "fonts"

    pairs: list[tuple[Path, Path]] = [
        (assets / "DejaVuSans.ttf", assets / "DejaVuSans-Bold.ttf"),
    ]

    roboto = _font_roboto_paths()
    if roboto:
        pairs.append(roboto)

    if sys.platform == "win32":
        win = Path("C:/Windows/Fonts")
        pairs.extend([
            (win / "arial.ttf", win / "arialbd.ttf"),
            (win / "segoeui.ttf", win / "segoeuib.ttf"),
        ])
    elif sys.platform == "darwin":
        mac = Path("/System/Library/Fonts/Supplemental")
        pairs.extend([
            (mac / "Arial.ttf", mac / "Arial Bold.ttf"),
        ])
    else:
        linux_dirs = [
            Path("/usr/share/fonts/truetype/dejavu"),
            Path("/usr/share/fonts/dejavu"),
            Path("/usr/share/fonts/truetype/liberation"),
            Path("/usr/share/fonts/truetype/noto"),
        ]
        for base in linux_dirs:
            pairs.extend([
                (base / "DejaVuSans.ttf", base / "DejaVuSans-Bold.ttf"),
                (base / "LiberationSans-Regular.ttf", base / "LiberationSans-Bold.ttf"),
                (base / "NotoSans-Regular.ttf", base / "NotoSans-Bold.ttf"),
            ])

    return pairs


def ensure_pdf_fonts() -> tuple[str, str]:
    """Đăng ký font TTF hỗ trợ Unicode (idempotent)."""
    global _REGISTERED
    if _REGISTERED:
        return FONT_REGULAR, FONT_BOLD

    for regular_path, bold_path in _candidate_pairs():
        if regular_path.is_file() and bold_path.is_file():
            pdfmetrics.registerFont(TTFont(FONT_REGULAR, str(regular_path)))
            pdfmetrics.registerFont(TTFont(FONT_BOLD, str(bold_path)))
            pdfmetrics.registerFontFamily(
                FONT_REGULAR,
                normal=FONT_REGULAR,
                bold=FONT_BOLD,
                italic=FONT_REGULAR,
                boldItalic=FONT_BOLD,
            )
            _REGISTERED = True
            log.debug("PDF font registered from %s", regular_path.parent)
            return FONT_REGULAR, FONT_BOLD

    raise RuntimeError(
        "Không tìm thấy font Unicode cho PDF. Cài package font-roboto hoặc "
        "fonts-dejavu-core (Linux), hoặc thêm DejaVuSans.ttf vào assets/fonts/."
    )
