import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/DatePicker.css';

const CustomDatePicker = ({
  selected,
  onChange,
  placeholder = "Select date...",
  className = "",
  disabled = false,
  minDate = null,
  maxDate = null,
  showTimeSelect = false,
  timeFormat = "HH:mm",
  timeIntervals = 15,
  dateFormat = "yyyy-MM-dd",
  showMonthDropdown = false,
  showYearDropdown = false,
  dropdownMode = "select",
  clearable = true,
  ...props
}) => {
  return (
    <div className={`custom-datepicker-wrapper ${className}`}>
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholder}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        showTimeSelect={showTimeSelect}
        timeFormat={timeFormat}
        timeIntervals={timeIntervals}
        dateFormat={dateFormat}
        showMonthDropdown={showMonthDropdown}
        showYearDropdown={showYearDropdown}
        dropdownMode={dropdownMode}
        isClearable={clearable}
        className="custom-datepicker-input"
        {...props}
      />
    </div>
  );
};

export default CustomDatePicker; 