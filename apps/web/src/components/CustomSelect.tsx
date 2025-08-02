import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CustomSelectProps {
  id?: string;
  name?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Constants for better maintainability
const STYLES = {
  container: 'relative',
  button: {
    base: 'flex-1 p-3 rounded-xl border text-left cursor-pointer flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500',
    enabled: 'bg-gray-800 border-gray-700 text-white',
    disabled: 'bg-gray-700 cursor-not-allowed text-gray-400'
  },
  dropdown: 'absolute z-10 w-full bg-gray-900 border border-gray-700 rounded-md mt-1 max-h-60 overflow-auto shadow-lg',
  option: 'p-3 cursor-pointer hover:bg-gray-700 text-gray-100',
  optionBorder: 'border-b border-gray-800',
  arrow: 'ml-2 text-gray-400'
} as const;

const DROPDOWN_ARROW = '▼';
const DEFAULT_PLACEHOLDER = 'Select an option';

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);
  const buttonClasses = `${STYLES.button.base} ${disabled ? STYLES.button.disabled : STYLES.button.enabled}`;

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className={`${STYLES.container} ${className}`} ref={selectRef}>
      <button
        type="button"
        className={buttonClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className={STYLES.arrow}>{DROPDOWN_ARROW}</span>
      </button>

      {isOpen && (
        <ul className={STYLES.dropdown}>
          {options.map((option, index) => {
            const isLastOption = index === options.length - 1;
            const optionClasses = `${STYLES.option} ${!isLastOption ? STYLES.optionBorder : ''}`;
            
            return (
              <li
                key={option.value}
                className={optionClasses}
                onClick={() => handleOptionClick(option.value)}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
