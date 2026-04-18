import React from 'react';
import './FormField.css';
const FormField = ({ label, error, help, children, required: req, className = '' }) => (
  <div className={`form-field ${error ? 'form-field--error' : ''} ${className}`}>
    {label && <label className="form-label">{label}{req && <span className="form-required"> *</span>}</label>}
    {children}
    {error && <p className="form-error">{error}</p>}
    {help && !error && <p className="form-help">{help}</p>}
  </div>
);
export const Input = ({ className = '', ...props }) => <input className={`form-input ${className}`} {...props} />;
export const Select = ({ className = '', children, ...props }) => <select className={`form-input ${className}`} {...props}>{children}</select>;
export const Textarea = ({ className = '', ...props }) => <textarea className={`form-input form-textarea ${className}`} {...props} />;
export default FormField;
