import { useState, useEffect } from "react";

/**
 * useScrolled – trả về true khi user đã scroll xuống quá `offset` px
 * @param {number} offset - số px cần scroll để trigger
 */
export function useScrolled(offset = 20) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > offset);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [offset]);

  return scrolled;
}
