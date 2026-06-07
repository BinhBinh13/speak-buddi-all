/** Nguồn sự thật duy nhất cho base URL backend (S1.1). */
export const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";
