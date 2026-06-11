// src/features/speaking/services/speakingHistoryService.js
import apiClient from "../../../shared/api/client";

export const saveSpeakingSession = (title, messages) =>
  apiClient("/api/speaking-history", {
    method: "POST",
    body: JSON.stringify({ title, messages }),
  });

export const listSpeakingHistory = () =>
  apiClient("/api/speaking-history");

export const getSpeakingSession = (id) =>
  apiClient(`/api/speaking-history/${id}`);

export const deleteSpeakingSession = (id) =>
  apiClient(`/api/speaking-history/${id}`, { method: "DELETE" });
