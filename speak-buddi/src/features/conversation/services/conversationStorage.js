// Lưu hội thoại: DB (primary) + sessionStorage (cache offline / fallback).
// Key theo topic + batch.

import apiClient from "../../../shared/api/client";

const PREFIX = "sb_conv";
const SAVE_DEBOUNCE_MS = 800;

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const pendingSaves = new Map();

function storageKey(topicId, batchIndex) {
  return `${PREFIX}_${topicId ?? "unknown"}_${batchIndex ?? 0}`;
}

function normalizeMessages(messages) {
  return (messages ?? []).map((m) => ({
    id:       m.id,
    role:     m.role,
    content:  m.content,
    ttsError: m.tts_error ?? m.ttsError ?? false,
  }));
}

function toApiMessages(messages) {
  return messages.map((m) => ({
    id:        m.id,
    role:      m.role,
    content:   m.content,
    tts_error: m.ttsError ?? false,
  }));
}

function saveLocalCache(topicId, batchIndex, state) {
  if (!topicId || !state.messages?.length) return;
  try {
    sessionStorage.setItem(
      storageKey(topicId, batchIndex),
      JSON.stringify({
        messages:     state.messages,
        coveredWords: [...(state.coveredWords ?? [])],
        batchDone:    Boolean(state.batchDone),
        updatedAt:    Date.now(),
      })
    );
  } catch {
    // ignore quota / private mode
  }
}

function loadLocalCache(topicId, batchIndex) {
  if (!topicId) return null;
  try {
    const raw = sessionStorage.getItem(storageKey(topicId, batchIndex));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.messages)) return null;
    return {
      messages:     normalizeMessages(data.messages),
      coveredWords: data.coveredWords ?? [],
      batchDone:    Boolean(data.batchDone),
    };
  } catch {
    return null;
  }
}

/**
 * Tải transcript từ DB; fallback sessionStorage nếu API lỗi.
 * @returns {Promise<{ messages: Array, coveredWords: string[], batchDone: boolean } | null>}
 */
export async function loadConversationState(topicId, batchIndex) {
  if (!topicId) return null;

  try {
    const data = await apiClient(
      `/api/topics/${topicId}/conversations/${batchIndex}`
    );
    if (data?.messages?.length) {
      const state = {
        messages:     normalizeMessages(data.messages),
        coveredWords: data.covered_words ?? [],
        batchDone:    Boolean(data.batch_done),
      };
      saveLocalCache(topicId, batchIndex, state);
      return state;
    }
  } catch {
    // offline / chưa migrate DB — fallback local
  }

  return loadLocalCache(topicId, batchIndex);
}

/**
 * Lưu ngay cache local + debounce ghi DB.
 * @param {Set<string>|string[]} coveredWords
 */
export function saveConversationState(topicId, batchIndex, { messages, coveredWords, batchDone }) {
  if (!topicId || !messages?.length) return;

  const covered = coveredWords instanceof Set ? [...coveredWords] : (coveredWords ?? []);
  const normalized = normalizeMessages(messages);

  saveLocalCache(topicId, batchIndex, {
    messages: normalized,
    coveredWords: covered,
    batchDone,
  });

  const key = storageKey(topicId, batchIndex);
  const existing = pendingSaves.get(key);
  if (existing) clearTimeout(existing);

  pendingSaves.set(
    key,
    setTimeout(() => {
      pendingSaves.delete(key);
      apiClient(`/api/topics/${topicId}/conversations/${batchIndex}`, {
        method: "PUT",
        body: JSON.stringify({
          messages:      toApiMessages(normalized),
          covered_words: covered,
          batch_done:    Boolean(batchDone),
        }),
      }).catch(() => {
        // DB lỗi — sessionStorage vẫn giữ bản cache
      });
    }, SAVE_DEBOUNCE_MS)
  );
}

/** Flush pending save ngay (gọi trước khi rời trang nếu cần). */
export async function flushConversationState(topicId, batchIndex, state) {
  if (!topicId || !state?.messages?.length) return;
  const key = storageKey(topicId, batchIndex);
  const pending = pendingSaves.get(key);
  if (pending) {
    clearTimeout(pending);
    pendingSaves.delete(key);
  }
  const covered = state.coveredWords instanceof Set
    ? [...state.coveredWords]
    : (state.coveredWords ?? []);
  const normalized = normalizeMessages(state.messages);
  saveLocalCache(topicId, batchIndex, { ...state, messages: normalized, coveredWords: covered });
  try {
    await apiClient(`/api/topics/${topicId}/conversations/${batchIndex}`, {
      method: "PUT",
      body: JSON.stringify({
        messages:      toApiMessages(normalized),
        covered_words: covered,
        batch_done:    Boolean(state.batchDone),
      }),
    });
  } catch {
    // ignore
  }
}

export function clearConversationState(topicId, batchIndex) {
  if (!topicId) return;
  const key = storageKey(topicId, batchIndex);
  const pending = pendingSaves.get(key);
  if (pending) {
    clearTimeout(pending);
    pendingSaves.delete(key);
  }
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
  apiClient(`/api/topics/${topicId}/conversations/${batchIndex}`, {
    method: "DELETE",
  }).catch(() => {});
}
