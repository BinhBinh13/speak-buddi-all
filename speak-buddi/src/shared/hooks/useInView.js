import { useState, useEffect, useRef } from "react";

/**
 * useInView – trigger khi element xuất hiện trong viewport
 * @param {number} threshold - % element cần hiển thị để trigger (0–1)
 * @returns {[React.RefObject, boolean]}
 */
export function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}
