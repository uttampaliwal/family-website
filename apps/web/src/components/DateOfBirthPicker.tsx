import React, { useState, useEffect, useMemo } from 'react';
import CustomSelect from './CustomSelect';

// Constants for better performance
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;
const YEARS_TO_SHOW = 100;

// Pre-calculate year options to avoid recalculation on every render
const currentYear = new Date().getFullYear();
const yearOptions = [{ value: '', label: 'Year' }, ...Array.from({ length: YEARS_TO_SHOW }, (_, i) => {
  const year = currentYear - i;
  return { value: year.toString(), label: year.toString() };
})];

interface DateOfBirthPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const DateOfBirthPicker: React.FC<DateOfBirthPickerProps> = ({ value, onChange, disabled }) => {
  // Internal state for the dropdowns
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Effect to sync component's internal state FROM the parent's `value` prop.
  // This runs only when the `value` prop from the parent changes.
  useEffect(() => {
    try {
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-');
        const parsedMonth = parseInt(m, 10);
        const parsedDay = parseInt(d, 10);
        
        if (isNaN(parsedMonth) || isNaN(parsedDay) || parsedMonth < 1 || parsedMonth > 12 || parsedDay < 1 || parsedDay > 31) {
          throw new Error('Invalid date values');
        }
        
        setYear(y);
        setMonth(parsedMonth.toString());
        setDay(parsedDay.toString());
      } else {
        // If the parent's value is cleared or invalid, reset the internal state.
        setYear('');
        setMonth('');
        setDay('');
      }
    } catch (error) {
      // Reset to empty state on parse error
      setYear('');
      setMonth('');
      setDay('');
    }
  }, [value]);

  // Effect to notify the parent component of a date change.
  // This runs whenever the internal day, month, or year state changes.
  useEffect(() => {
    try {
      // Only proceed if all three parts of the date are selected.
      if (day && month && year) {
        // Validate date values before formatting
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        
        if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
          throw new Error('Invalid date components');
        }
        
        // Format the date into YYYY-MM-DD string.
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        // *** THE CRITICAL FIX TO PREVENT INFINITE LOOPS ***
        // Only call the parent's onChange function if the newly constructed date
        // is different from the `value` prop we received. This breaks the update cycle.
        if (formattedDate !== value) {
          onChange(formattedDate);
        }
      }
    } catch (error) {
      // Silently handle formatting errors to prevent crashes
      return;
    }
  }, [day, month, year, onChange, value]); // `value` is a dependency to ensure the comparison is always up-to-date.

  // Memoize options to prevent re-calculation on every render.
  const dayOptions = useMemo(() => {
    const days = Array.from({ length: 31 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }));
    return [{ value: '', label: 'Day' }, ...days];
  }, []);

  const monthOptions = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: MONTH_NAMES[i] }));
    return [{ value: '', label: 'Month' }, ...months];
  }, []);



  return (
    <div className="flex-1 flex items-center gap-2">
      <div className="flex-1">
        <CustomSelect options={dayOptions} value={day} onChange={setDay} placeholder="Day" disabled={disabled} className="w-full" />
      </div>
      <div className="flex-1">
        <CustomSelect options={monthOptions} value={month} onChange={setMonth} placeholder="Month" disabled={disabled} className="w-full" />
      </div>
      <div className="flex-1">
        <CustomSelect options={yearOptions} value={year} onChange={setYear} placeholder="Year" disabled={disabled} className="w-full" />
      </div>
    </div>
  );
};

export default DateOfBirthPicker;