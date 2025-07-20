import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/DatePicker.css';

const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
  placeholder = "Select date range...",
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
    <div className={`custom-daterange-wrapper ${className}`}>
      <DatePicker
        selectsRange={true}
        startDate={startDate}
        endDate={endDate}
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
        className="custom-daterange-input"
        {...props}
      />
    </div>
  );
};

export default DateRangePicker; 