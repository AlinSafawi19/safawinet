import React, { createContext, useContext, useState } from 'react';

const LiraRateConverterContext = createContext();

export const useLiraRateConverter = () => {
    const context = useContext(LiraRateConverterContext);
    if (!context) {
        throw new Error('useLiraRateConverter must be used within a LiraRateConverterProvider');
    }
    return context;
};

export const LiraRateConverterProvider = ({ children }) => {
    const [isLiraRateConverterOpen, setIsLiraRateConverterOpen] = useState(false);
    const [liraRateConverterPosition, setLiraRateConverterPosition] = useState({ x: 60, y: 160 });
    const [liraRateConverterSize, setLiraRateConverterSize] = useState({ width: 340, height: 320 });

    const openLiraRateConverter = () => {
        setIsLiraRateConverterOpen(true);
    };

    const closeLiraRateConverter = () => {
        setIsLiraRateConverterOpen(false);
    };

    const toggleLiraRateConverter = () => {
        setIsLiraRateConverterOpen(!isLiraRateConverterOpen);
    };

    const updateLiraRateConverterPosition = (position) => {
        setLiraRateConverterPosition(position);
    };

    const updateLiraRateConverterSize = (size) => {
        setLiraRateConverterSize(size);
    };

    const value = {
        isLiraRateConverterOpen,
        liraRateConverterPosition,
        liraRateConverterSize,
        openLiraRateConverter,
        closeLiraRateConverter,
        toggleLiraRateConverter,
        updateLiraRateConverterPosition,
        updateLiraRateConverterSize
    };

    return (
        <LiraRateConverterContext.Provider value={value}>
            {children}
        </LiraRateConverterContext.Provider>
    );
};

const DEFAULT_RATE = 89000;