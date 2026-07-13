import React, { useState, useEffect } from "react";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const total = docHeight - winHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      const pct = (window.scrollY / total) * 100;
      setProgress(pct);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger once on mount
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: "3px",
        background: "linear-gradient(90deg, #dc2626, #ef4444)",
        boxShadow: "0 0 8px rgba(220, 38, 38, 0.8), 0 0 16px rgba(220, 38, 38, 0.4)",
        zIndex: 99999,
        pointerEvents: "none",
        transition: "width 0.08s ease-out"
      }}
    />
  );
}
