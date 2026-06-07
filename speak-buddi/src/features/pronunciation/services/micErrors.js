// speak-buddi/src/features/pronunciation/services/micErrors.js
// Map DOMException từ getUserMedia → { code, message } theo SRS §5.2

export const MIC_ERROR = {
  DENIED:      "denied",
  NOTFOUND:    "notfound",
  UNSUPPORTED: "unsupported",
  NOAUDIO:     "noaudio",
};

/**
 * Map DOMException (từ getUserMedia) → { code, message } khớp SRS §5.2.
 * @param {DOMException} err
 * @returns {{ code: string, message: string }}
 */
export function mapGetUserMediaError(err) {
  const name = err?.name ?? "";

  if (["NotAllowedError", "SecurityError", "PermissionDeniedError"].includes(name)) {
    return {
      code:    MIC_ERROR.DENIED,
      message: "🎤 Bạn chưa cấp quyền microphone. Vào Settings → trình duyệt → cho phép mic.",
    };
  }

  if (["NotFoundError", "DevicesNotFoundError", "OverconstrainedError"].includes(name)) {
    return {
      code:    MIC_ERROR.NOTFOUND,
      message: "🎤 Không tìm thấy microphone. Kiểm tra thiết bị.",
    };
  }

  // NotSupportedError hoặc bất kỳ lỗi khác → unsupported
  return {
    code:    MIC_ERROR.UNSUPPORTED,
    message: "🎤 Trình duyệt không hỗ trợ. Vui lòng dùng Chrome hoặc Edge.",
  };
}

/** Lỗi khi blob ghi âm rỗng / quá ngắn (SRS §5.2) */
export const NOAUDIO_ERROR = {
  code:    MIC_ERROR.NOAUDIO,
  message: "🎤 Không nghe thấy gì. Hãy thử nói lại.",
};
