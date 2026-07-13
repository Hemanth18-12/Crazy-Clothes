import React from "react";
import { Link } from "react-router-dom";
import "../css/logo.css";

const WORD1 = "CRAZY";
const WORD2 = "CLOTHS";

export default function LogoMark({ onClick }) {
  return (
    <Link to="/" className="cc-logomark" onClick={onClick} aria-label="Crazy Cloths Home">
      <span className="cc-logo-word">
        {WORD1.split("").map((char, i) => (
          <span key={i} className="cc-logo-letter" style={{ "--i": i }}>{char}</span>
        ))}
      </span>
      <span className="cc-logo-sep">&nbsp;</span>
      <span className="cc-logo-word cc-logo-word--accent">
        {WORD2.split("").map((char, i) => (
          <span key={i} className="cc-logo-letter" style={{ "--i": WORD1.length + i + 1 }}>{char}</span>
        ))}
      </span>
    </Link>
  );
}
