import { useEffect, useRef, useState } from "react";

export const Reveal = ({ children, delay = 0, className = "", as: Tag = "div" }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => setVisible(true), delay);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -80px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`}>
      {children}
    </Tag>
  );
};

export default Reveal;
