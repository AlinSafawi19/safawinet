import React, { useState, useEffect } from 'react';
import '../styles/Tooltip.css';

/**
 * Reusable Tooltip component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The element that triggers the tooltip
 * @param {string} props.text - The text to display in the tooltip (optional, will use children text if not provided)
 * @param {string} props.position - Tooltip position: 'top', 'bottom', 'left', 'right' (default: 'top')
 * @param {string} props.className - Additional CSS classes for the trigger element
 * @param {boolean} props.disabled - Whether the tooltip is disabled (default: false)
 * @param {boolean} props.showOnTruncated - Only show tooltip if text is truncated (default: true)
 * 
 * @example
 * // Basic usage
 * <Tooltip text="This is a tooltip">
 *   <span>Hover me</span>
 * </Tooltip>
 * 
 * @example
 * // With custom position
 * <Tooltip text="Bottom tooltip" position="bottom">
 *   <button>Hover me</button>
 * </Tooltip>
 * 
 * @example
 * // Only show if text is truncated
 * <Tooltip text="Full text here" showOnTruncated={true}>
 *   <div style={{ width: '100px', overflow: 'hidden' }}>
 *     Very long text that might be truncated
 *   </div>
 * </Tooltip>
 */
const Tooltip = ({ 
  children, 
  text, 
  position = 'top', 
  className = '', 
  disabled = false,
  showOnTruncated = true 
}) => {
  const [tooltip, setTooltip] = useState({ 
    show: false, 
    text: '', 
    x: 0, 
    y: 0 
  });

  const showTooltip = (event) => {
    if (disabled) return;

    const element = event.target;
    const rect = element.getBoundingClientRect();
    
    // Check if text is actually truncated (only if showOnTruncated is true)
    if (showOnTruncated && element.scrollWidth <= element.clientWidth) {
      return;
    }

    setTooltip({
      show: true,
      text: text || element.textContent || element.innerText,
      x: rect.left + rect.width / 2,
      y: position === 'top' ? rect.top - 10 : rect.bottom + 10
    });
  };

  const hideTooltip = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  };

  // Clean up tooltip when component unmounts
  useEffect(() => {
    return () => {
      setTooltip({ show: false, text: '', x: 0, y: 0 });
    };
  }, []);

  return (
    <>
      <div
        className={`tooltip-trigger ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {tooltip.show && (
        <div
          className={`custom-tooltip tooltip-${position}`}
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: position === 'top' ? 'translateX(-50%)' : 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            maxWidth: '300px',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            pointerEvents: 'none'
          }}
        >
          {tooltip.text}
          <div
            className={`tooltip-arrow tooltip-arrow-${position}`}
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              ...(position === 'top' 
                ? { 
                    top: '100%',
                    borderTop: '5px solid #1f2937'
                  }
                : { 
                    bottom: '100%',
                    borderBottom: '5px solid #1f2937'
                  }
              )
            }}
          />
        </div>
      )}
    </>
  );
};

export default Tooltip; 