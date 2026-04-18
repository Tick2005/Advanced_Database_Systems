import React from 'react';
import './Button.css';
const Button = ({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }) => (
  <button
    className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <span className="btn-spinner" />}
    {children}
  </button>
);
export default Button;
