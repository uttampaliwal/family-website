import React, { useState, useEffect, useMemo } from 'react';
import CustomSelect from './CustomSelect';

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
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      setYear(y);
      // The internal state for month is the numeric value (e.g., "1", "12")
      setMonth(parseInt(m, 10).toString());
      setDay(parseInt(d, 10).toString());
    } else {
      // If the parent's value is cleared or invalid, reset the internal state.
      setYear('');
      setMonth('');
      setDay('');
    }
  }, [value]);

  // Effect to notify the parent component of a date change.
  // This runs whenever the internal day, month, or year state changes.
  useEffect(() => {
    // Only proceed if all three parts of the date are selected.
    if (day && month && year) {
      // Format the date into YYYY-MM-DD string.
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      // *** THE CRITICAL FIX TO PREVENT INFINITE LOOPS ***
      // Only call the parent's onChange function if the newly constructed date
      // is different from the `value` prop we received. This breaks the update cycle.
      if (formattedDate !== value) {
        onChange(formattedDate);
      }
    }
  }, [day, month, year, onChange, value]); // `value` is a dependency to ensure the comparison is always up-to-date.

  // Memoize options to prevent re-calculation on every render.
  const dayOptions = useMemo(() => {
    const days = Array.from({ length: 31 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }));
    return [{ value: '', label: 'Day' }, ...days];
  }, []);

  const monthOptions = useMemo(() => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    // The `value` should be the simple number ("1", "2", etc.) to match our state.
    const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: monthNames[i] }));
    return [{ value: '', label: 'Month' }, ...months];
  }, []);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => ({ value: (currentYear - i).toString(), label: (currentYear - i).toString() }));
    return [{ value: '', label: 'Year' }, ...years];
  }, []);

  return (
    <div className="flex-1 flex items-center gap-2">
      <div className="flex-1">
        <CustomSelect options={dayOptions} value={day} onChange={setDay} placeholder="Day" disabled={disabled} />
      </div>
      <div className="flex-[2]">
        <CustomSelect options={monthOptions} value={month} onChange={setMonth} placeholder="Month" disabled={disabled} />
      </div>
      <div className="flex-1">
        <CustomSelect options={yearOptions} value={year} onChange={setYear} placeholder="Year" disabled={disabled} />
      </div>
    </div>
  );
};

export default DateOfBirthPicker;