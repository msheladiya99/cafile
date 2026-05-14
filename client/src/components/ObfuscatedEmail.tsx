import React from 'react';

type ObfuscatedEmailProps = {
  user: string;
  domain?: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
};

export const ObfuscatedEmail: React.FC<ObfuscatedEmailProps> = ({
  user,
  domain = 'mycafile.in',
  label = 'Email us',
  className,
  style,
}) => {
  const handleClick = () => {
    window.location.href = `mailto:${user}@${domain}`;
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      style={{
        appearance: 'none',
        background: 'none',
        border: 0,
        color: 'inherit',
        cursor: 'pointer',
        font: 'inherit',
        padding: 0,
        textAlign: 'left',
        ...style,
      }}
    >
      {label}
    </button>
  );
};
