import React, { createContext, useContext, useState } from 'react';

const CalculatorContext = createContext();

export const useCalculator = () => {
    const context = useContext(CalculatorContext);
    if (!context) {
        throw new Error('useCalculator must be used within a CalculatorProvider');
    }
    return context;
};

export const CalculatorProvider = ({ children }) => {
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [calculatorPosition, setCalculatorPosition] = useState({ x: 20, y: 100 });
    const [calculatorSize, setCalculatorSize] = useState({ width: 320, height: 480 });

    const openCalculator = () => {
        setIsCalculatorOpen(true);
    };

    const closeCalculator = () => {
        setIsCalculatorOpen(false);
    };

    const toggleCalculator = () => {
        setIsCalculatorOpen(!isCalculatorOpen);
    };

    const updateCalculatorPosition = (position) => {
        setCalculatorPosition(position);
    };

    const updateCalculatorSize = (size) => {
        setCalculatorSize(size);
    };

    const value = {
        isCalculatorOpen,
        calculatorPosition,
        calculatorSize,
        openCalculator,
        closeCalculator,
        toggleCalculator,
        updateCalculatorPosition,
        updateCalculatorSize
    };

    return (
        <CalculatorContext.Provider value={value}>
            {children}
        </CalculatorContext.Provider>
    );
}; 