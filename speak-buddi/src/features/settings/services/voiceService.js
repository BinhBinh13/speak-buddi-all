import apiClient from "../../../shared/api/client";

/**
 * GET /api/voice/models — danh sách voice ElevenLabs active (S8.4, AC-11-01).
 * Yêu cầu Paid User (JWT is_paid=true); free user → 403.
 */
export async function getVoiceModels() {
  return apiClient("/api/voice/models");
}

/**
 * GET /api/voice/preference — preference hiện tại của user (S8.4).
 * @returns {Promise<{voice_model_id: ?string, voice: ?object}>}
 */
export async function getVoicePreference() {
  return apiClient("/api/voice/preference");
}

/**
 * PUT /api/voice/preference — lưu voice đã chọn (S8.4, AC-11-02).
 * @param {string} voiceModelId - UUID của elevenlabs_voice_model
 */
export async function setVoicePreference(voiceModelId) {
  return apiClient("/api/voice/preference", {
    method: "PUT",
    body: JSON.stringify({ voice_model_id: voiceModelId }),
  });
}
