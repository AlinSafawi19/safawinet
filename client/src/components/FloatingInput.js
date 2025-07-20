import React, { useState, useEffect, useRef } from 'react';
import { FiEye, FiEyeOff, FiCopy } from 'react-icons/fi';
import '../styles/FloatingInput.css';

const FloatingInput = ({
    type = 'text',
    id,
    value,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    label,
    error,
    disabled = false,
    required = false,
    maxLength,
    minLength,
    pattern,
    autoComplete,
    autoFocus = false,
    className = '',
    copyable = false,
    icon = null,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [inputType, setInputType] = useState(type);
    const inputRef = useRef(null);

    // Handle password visibility toggle
    useEffect(() => {
        if (type === 'password') {
            setInputType(showPassword ? 'text' : 'password');
        } else {
            setInputType(type);
        }
    }, [type, showPassword]);

    // Check for auto-filled content on mount and after a delay
    useEffect(() => {
        const checkAutoFill = () => {
            if (inputRef.current) {
                // Check if the input has a value (auto-filled or manually entered)
                const hasValue = inputRef.current.value && inputRef.current.value.length > 0;
                
                // Also check for webkit autofill styles
                const computedStyle = window.getComputedStyle(inputRef.current);
                const webkitAutofill = computedStyle.webkitBoxShadow !== 'none' && 
                                     computedStyle.webkitBoxShadow.includes('inset');
                
                if (hasValue || webkitAutofill) {
                    // Trigger a focus event to ensure the label floats
                    if (!isFocused) {
                        setIsFocused(true);
                    }
                }
            }
        };

        // Check immediately
        checkAutoFill();
        
        // Check again after a short delay to catch late auto-fills
        const timeoutId = setTimeout(checkAutoFill, 100);
        
        // Check again after a longer delay for slower auto-fills
        const timeoutId2 = setTimeout(checkAutoFill, 500);
        
        // Set up a mutation observer to watch for attribute changes
        const observer = new MutationObserver(checkAutoFill);
        if (inputRef.current) {
            observer.observe(inputRef.current, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }

        return () => {
            clearTimeout(timeoutId);
            clearTimeout(timeoutId2);
            observer.disconnect();
        };
    }, [isFocused]);

    // Handle focus state
    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    // Handle blur state
    const handleBlur = (e) => {
        // Only set focused to false if there's no value
        const hasValue = e.target.value && e.target.value.length > 0;
        if (!hasValue) {
            setIsFocused(false);
        }
        if (onBlur) onBlur(e);
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Copy to clipboard
    const copyToClipboard = () => {
        if (value) {
            navigator.clipboard.writeText(value).then(() => {
                // You can add a toast notification here if needed
                console.log('Copied to clipboard');
            }).catch(() => {
                console.error('Failed to copy to clipboard');
            });
        }
    };

    // Determine if label should float
    const shouldFloat = isFocused || value || (placeholder && isFocused);

    return (
        <div className={`floating-input-container ${className}`}>
            <div className={`floating-input-wrapper ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''} ${icon ? 'has-icon' : ''}`}>
                {icon && (
                    <div className="floating-input-icon">
                        {icon}
                    </div>
                )}
                {type === 'textarea' ? (
                    <textarea
                        ref={inputRef}
                        id={id}
                        value={value}
                        onChange={onChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        maxLength={maxLength}
                        minLength={minLength}
                        autoComplete={autoComplete}
                        autoFocus={autoFocus}
                        className="floating-input"
                        {...props}
                    />
                ) : (
                    <input
                        ref={inputRef}
                        type={inputType}
                        id={id}
                        value={value}
                        onChange={onChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        maxLength={maxLength}
                        minLength={minLength}
                        pattern={pattern}
                        autoComplete={autoComplete}
                        autoFocus={autoFocus}
                        className="floating-input"
                        {...props}
                    />
                )}

                {label && (
                    <label
                        htmlFor={id}
                        className={`floating-label ${shouldFloat ? 'floating' : ''}`}
                    >
                        {label}
                        {required && <span className="required-asterisk">*</span>}
                    </label>
                )}

                {type === 'password' && (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="password-toggle-btn"
                        disabled={disabled}
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                )}

                {copyable && value && (
                    <button
                        type="button"
                        onClick={copyToClipboard}
                        className="copy-toggle-btn"
                        disabled={disabled}
                        title="Copy to clipboard"
                    >
                        <FiCopy />
                    </button>
                )}
            </div>

            {error && (
                <div className="floating-input-error">
                    {error}
                </div>
            )}
        </div>
    );
};

export default FloatingInput; 