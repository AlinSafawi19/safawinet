import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiMinimize2, FiMove, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import { useLiraRateConverter } from '../contexts/LiraRateConverterContext';

const DEFAULT_RATE = 89000;

const LiraRateConverter = () => {
    const {
        isLiraRateConverterOpen,
        closeLiraRateConverter,
        liraRateConverterPosition,
        liraRateConverterSize,
        updateLiraRateConverterPosition,
        updateLiraRateConverterSize
    } = useLiraRateConverter();

    const [rate, setRate] = useState(DEFAULT_RATE);
    const [lira, setLira] = useState('');
    const [usd, setUsd] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const converterRef = useRef(null);
    const headerRef = useRef(null);

    // Conversion logic
    const handleLiraChange = (e) => {
        const value = e.target.value.replace(/[^\d.]/g, '');
        setLira(value);
        if (value === '' || isNaN(Number(value))) {
            setUsd('');
        } else {
            setUsd((Number(value) / rate).toFixed(2));
        }
    };

    const handleUsdChange = (e) => {
        const value = e.target.value.replace(/[^\d.]/g, '');
        setUsd(value);
        if (value === '' || isNaN(Number(value))) {
            setLira('');
        } else {
            setLira((Number(value) * rate).toFixed(0));
        }
    };

    const handleRateChange = (e) => {
        const value = e.target.value.replace(/[^\d.]/g, '');
        setRate(value === '' ? '' : Number(value));
        // Recalculate
        if (usd !== '') {
            setLira((Number(usd) * Number(value)).toFixed(0));
        } else if (lira !== '') {
            setUsd((Number(lira) / Number(value)).toFixed(2));
        }
    };

    const handleReset = () => {
        setRate(DEFAULT_RATE);
        setLira('');
        setUsd('');
    };

    // Dragging
    const handleMouseDown = (e) => {
        if (e.target.closest('.lira-converter-header-controls')) return;
        setIsDragging(true);
        const rect = converterRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };
    const handleMouseMove = (e) => {
        if (isDragging) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            const maxX = window.innerWidth - liraRateConverterSize.width;
            const maxY = window.innerHeight - liraRateConverterSize.height;
            const newPosition = {
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            };
            updateLiraRateConverterPosition(newPosition);
        }
    };
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    // Resizing
    const handleResizeStart = (e) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: liraRateConverterSize.width,
            height: liraRateConverterSize.height
        });
    };
    const handleResizeMove = (e) => {
        if (isResizing) {
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;
            const newWidth = Math.max(280, Math.min(500, resizeStart.width + deltaX));
            const newHeight = Math.max(200, Math.min(400, resizeStart.height + deltaY));
            updateLiraRateConverterSize({ width: newWidth, height: newHeight });
        }
    };
    const handleResizeEnd = () => {
        setIsResizing(false);
    };
    // Minimize
    const handleMinimize = () => {
        setIsMinimized(!isMinimized);
    };
    // Event listeners
    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove);
            document.addEventListener('mouseup', isDragging ? handleMouseUp : handleResizeEnd);
            return () => {
                document.removeEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove);
                document.removeEventListener('mouseup', isDragging ? handleMouseUp : handleResizeEnd);
            };
        }
    }, [isDragging, isResizing, dragOffset, resizeStart]);

    if (!isLiraRateConverterOpen) return null;

    return (
        <div
            ref={converterRef}
            className={`calculator lira-rate-converter${isMinimized ? ' calculator-minimized' : ''}`}
            style={{
                left: liraRateConverterPosition.x,
                top: liraRateConverterPosition.y,
                width: liraRateConverterSize.width,
                height: liraRateConverterSize.height,
                cursor: isDragging ? 'grabbing' : 'default',
                zIndex: 1100
            }}
        >
            {/* Header */}
            <div
                ref={headerRef}
                className="calculator-header"
                onMouseDown={handleMouseDown}
            >
                <div className="calculator-title">
                    <FiDollarSign />
                    <span>Lira Rate Converter</span>
                </div>
                <div className="calculator-header-controls lira-converter-header-controls">
                    <button
                        className="calculator-control-btn"
                        onClick={handleMinimize}
                        title="Minimize"
                    >
                        <FiMinimize2 />
                    </button>
                    <button
                        className="calculator-control-btn"
                        onClick={closeLiraRateConverter}
                        title="Close"
                    >
                        <FiX />
                    </button>
                </div>
            </div>
            {/* Body */}
            <div className="calculator-body">
                <div style={{ padding: '1.2rem', display: isMinimized ? 'none' : 'block' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                        <label style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Lebanese Lira (LBP)</span>
                            <input
                                className="form-input"
                                type="text"
                                inputMode="decimal"
                                value={lira}
                                onChange={handleLiraChange}
                                placeholder="Enter Lira"
                                style={{ marginTop: 4 }}
                            />
                        </label>
                        <label style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>US Dollar (USD)</span>
                            <input
                                className="form-input"
                                type="text"
                                inputMode="decimal"
                                value={usd}
                                onChange={handleUsdChange}
                                placeholder="Enter USD"
                                style={{ marginTop: 4 }}
                            />
                        </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Rate:</span>
                        <input
                            className="form-input"
                            type="text"
                            inputMode="decimal"
                            value={rate}
                            onChange={handleRateChange}
                            style={{ width: 100, marginRight: 8 }}
                        />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>LBP = 1 USD</span>
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginLeft: 'auto' }}
                            onClick={handleReset}
                            title="Reset"
                        >
                            <FiRefreshCw /> Reset
                        </button>
                    </div>
                </div>
            </div>
            {/* Resize Handle */}
            <div
                className="calculator-resize-handle"
                onMouseDown={handleResizeStart}
            >
                <FiMove />
            </div>
        </div>
    );
};

export default LiraRateConverter; 