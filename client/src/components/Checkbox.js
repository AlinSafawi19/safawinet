import React from 'react';
import PropTypes from 'prop-types';
import '../styles/Checkbox.css';

const Checkbox = ({
  id,
  name,
  checked,
  onChange,
  disabled = false,
  label,
  description,
  className = '',
  required = false,
  size = 'medium',
  variant = 'default',
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        const newEvent = {
          ...e,
          target: {
            ...e.target,
            checked: !checked
          }
        };
        handleChange(newEvent);
      }
    }
  };

  const checkboxId = id || `checkbox-${name || Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`checkbox-container ${className} ${size} ${variant}`}>
      <label 
        className={`checkbox-label ${disabled ? 'disabled' : ''}`}
        htmlFor={checkboxId}
        onKeyPress={handleKeyPress}
        tabIndex={disabled ? -1 : 0}
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled}
      >
        <input
          type="checkbox"
          id={checkboxId}
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className="checkbox-input"
          {...props}
        />
        <span className="checkbox-custom"></span>
        
        {(label || description) && (
          <div className="checkbox-content">
            {label && (
              <span className="checkbox-text">
                {label}
                {required && <span className="required-asterisk">*</span>}
              </span>
            )}
            {description && (
              <span className="checkbox-description">{description}</span>
            )}
          </div>
        )}
      </label>
    </div>
  );
};

Checkbox.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string,
  required: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'success', 'warning', 'danger'])
};

export default Checkbox; 