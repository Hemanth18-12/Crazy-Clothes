import React from 'react';

export default function LoadingSpinner({ fullPage = false }) {
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: fullPage ? '100vh' : '200px',
    width: '100%',
    backgroundColor: 'transparent',
    transition: 'all 0.3s ease',
  };

  const spinnerStyle = {
    width: '40px',
    height: '40px',
    border: '3px solid var(--color-border, #1a1a1a)',
    borderTop: '3px solid var(--color-accent, #ff4e50)',
    borderRadius: '50%',
    animation: 'button-spin 1s linear infinite',
  };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle}></div>
    </div>
  );
}
