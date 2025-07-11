import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiMinimize2, FiMaximize2, FiMove, FiPlus, FiClock, FiTrash2 } from 'react-icons/fi';
import { useCalculator } from '../contexts/CalculatorContext';

const Calculator = () => {
    const { 
        isCalculatorOpen, 
        closeCalculator, 
        calculatorPosition, 
        calculatorSize,
        updateCalculatorPosition,
        updateCalculatorSize
    } = useCalculator();
    const [display, setDisplay] = useState('0');
    const [previousValue, setPreviousValue] = useState(null);
    const [operation, setOperation] = useState(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    
    const calculatorRef = useRef(null);
    const headerRef = useRef(null);

    // Calculator logic
    const inputDigit = (digit) => {
        if (waitingForOperand) {
            setDisplay(String(digit));
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? String(digit) : display + digit);
        }
    };

    const inputDecimal = () => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
        } else if (display.indexOf('.') === -1) {
            setDisplay(display + '.');
        }
    };

    const clear = () => {
        setDisplay('0');
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(false);
    };

    const performOperation = (nextOperation) => {
        const inputValue = parseFloat(display);

        if (previousValue === null) {
            setPreviousValue(inputValue);
        } else if (operation) {
            const currentValue = previousValue || 0;
            const newValue = calculate(currentValue, inputValue, operation);
            setDisplay(String(newValue));
            setPreviousValue(newValue);
        }

        setWaitingForOperand(true);
        setOperation(nextOperation);
    };

    const calculate = (firstValue, secondValue, operation) => {
        switch (operation) {
            case '+':
                return firstValue + secondValue;
            case '-':
                return firstValue - secondValue;
            case '×':
                return firstValue * secondValue;
            case '÷':
                return firstValue / secondValue;
            default:
                return secondValue;
        }
    };

    const handleEquals = () => {
        const inputValue = parseFloat(display);

        if (previousValue === null || operation === null) {
            return;
        }

        const newValue = calculate(previousValue, inputValue, operation);
        const historyEntry = {
            id: Date.now(),
            expression: `${previousValue} ${operation} ${inputValue}`,
            result: newValue,
            timestamp: new Date().toLocaleTimeString()
        };
        
        setHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
        setDisplay(String(newValue));
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(true);
    };

    const handlePercentage = () => {
        const currentValue = parseFloat(display);
        const newValue = currentValue / 100;
        setDisplay(String(newValue));
    };

    const handlePlusMinus = () => {
        const currentValue = parseFloat(display);
        const newValue = -currentValue;
        setDisplay(String(newValue));
    };

    // Dragging functionality
    const handleMouseDown = (e) => {
        if (e.target.closest('.calculator-header-controls')) return;
        
        setIsDragging(true);
        const rect = calculatorRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            
            // Keep calculator within viewport bounds
            const maxX = window.innerWidth - calculatorSize.width;
            const maxY = window.innerHeight - calculatorSize.height;
            
            const newPosition = {
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            };
            
            updateCalculatorPosition(newPosition);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Resizing functionality
    const handleResizeStart = (e) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: calculatorSize.width,
            height: calculatorSize.height
        });
    };

    const handleResizeMove = (e) => {
        if (isResizing) {
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;
            
            const newWidth = Math.max(280, Math.min(500, resizeStart.width + deltaX));
            const newHeight = Math.max(400, Math.min(600, resizeStart.height + deltaY));
            
            updateCalculatorSize({ width: newWidth, height: newHeight });
        }
    };

    const handleResizeEnd = () => {
        setIsResizing(false);
    };

    // Minimize functionality
    const handleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    // History functionality
    const toggleHistory = () => {
        setShowHistory(!showHistory);
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const handleHistoryEntry = (entry) => {
        setDisplay(String(entry.result));
        setShowHistory(false);
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

    // Keyboard support
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!isCalculatorOpen) return;
            
            switch (e.key) {
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    inputDigit(parseInt(e.key));
                    break;
                case '.':
                    inputDecimal();
                    break;
                case '+':
                    performOperation('+');
                    break;
                case '-':
                    performOperation('-');
                    break;
                case '*':
                    performOperation('×');
                    break;
                case '/':
                    e.preventDefault();
                    performOperation('÷');
                    break;
                case 'Enter':
                case '=':
                    handleEquals();
                    break;
                case 'Escape':
                    clear();
                    break;
                case 'Backspace':
                    if (display.length > 1) {
                        setDisplay(display.slice(0, -1));
                    } else {
                        setDisplay('0');
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [display, waitingForOperand, operation, previousValue, isCalculatorOpen]);

    if (!isCalculatorOpen) return null;

    return (
        <div
            ref={calculatorRef}
            className={`calculator ${isMinimized ? 'calculator-minimized' : ''}`}
            style={{
                left: calculatorPosition.x,
                top: calculatorPosition.y,
                width: calculatorSize.width,
                height: calculatorSize.height,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            {/* Header */}
            <div 
                ref={headerRef}
                className="calculator-header"
                onMouseDown={handleMouseDown}
            >
                <div className="calculator-title">
                    <FiPlus />
                    <span>Calculator</span>
                </div>
                <div className="calculator-header-controls">
                    <button 
                        className="calculator-control-btn"
                        onClick={toggleHistory}
                        title="History"
                    >
                        <FiClock />
                    </button>
                    <button 
                        className="calculator-control-btn"
                        onClick={handleMinimize}
                        title="Minimize"
                    >
                        <FiMinimize2 />
                    </button>
                    <button 
                        className="calculator-control-btn"
                        onClick={closeCalculator}
                        title="Close"
                    >
                        <FiX />
                    </button>
                </div>
            </div>

            {/* Calculator Body */}
            <div className="calculator-body">
                {showHistory ? (
                    <div className="calculator-history">
                        <div className="history-header">
                            <h3>History</h3>
                            <button 
                                className="history-clear-btn"
                                onClick={clearHistory}
                                title="Clear History"
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                        <div className="history-list">
                            {history.length === 0 ? (
                                <div className="history-empty">
                                    <FiClock />
                                    <p>No calculations yet</p>
                                </div>
                            ) : (
                                history.map((entry) => (
                                    <div 
                                        key={entry.id} 
                                        className="history-item"
                                        onClick={() => handleHistoryEntry(entry)}
                                    >
                                        <div className="history-expression">{entry.expression}</div>
                                        <div className="history-result">= {entry.result}</div>
                                        <div className="history-time">{entry.timestamp}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Display */}
                        <div className="calculator-display">
                            <div className="calculator-display-content">
                                <div className="calculator-expression">
                                    {previousValue !== null && operation && (
                                        <span>{previousValue} {operation}</span>
                                    )}
                                </div>
                                <div className="calculator-result">{display}</div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="calculator-buttons">
                    {/* Row 1 */}
                    <button className="calculator-btn calculator-btn-secondary" onClick={clear}>
                        AC
                    </button>
                    <button className="calculator-btn calculator-btn-secondary" onClick={handlePlusMinus}>
                        ±
                    </button>
                    <button className="calculator-btn calculator-btn-secondary" onClick={handlePercentage}>
                        %
                    </button>
                    <button className="calculator-btn calculator-btn-operator" onClick={() => performOperation('÷')}>
                        ÷
                    </button>

                    {/* Row 2 */}
                    <button className="calculator-btn" onClick={() => inputDigit(7)}>7</button>
                    <button className="calculator-btn" onClick={() => inputDigit(8)}>8</button>
                    <button className="calculator-btn" onClick={() => inputDigit(9)}>9</button>
                    <button className="calculator-btn calculator-btn-operator" onClick={() => performOperation('×')}>
                        ×
                    </button>

                    {/* Row 3 */}
                    <button className="calculator-btn" onClick={() => inputDigit(4)}>4</button>
                    <button className="calculator-btn" onClick={() => inputDigit(5)}>5</button>
                    <button className="calculator-btn" onClick={() => inputDigit(6)}>6</button>
                    <button className="calculator-btn calculator-btn-operator" onClick={() => performOperation('-')}>
                        −
                    </button>

                    {/* Row 4 */}
                    <button className="calculator-btn" onClick={() => inputDigit(1)}>1</button>
                    <button className="calculator-btn" onClick={() => inputDigit(2)}>2</button>
                    <button className="calculator-btn" onClick={() => inputDigit(3)}>3</button>
                    <button className="calculator-btn calculator-btn-operator" onClick={() => performOperation('+')}>
                        +
                    </button>

                    {/* Row 5 */}
                    <button className="calculator-btn calculator-btn-zero" onClick={() => inputDigit(0)}>
                        0
                    </button>
                    <button className="calculator-btn" onClick={inputDecimal}>.</button>
                    <button className="calculator-btn calculator-btn-equals" onClick={handleEquals}>
                        =
                    </button>
                </div>
                        </>
                    )}
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

export default Calculator; 