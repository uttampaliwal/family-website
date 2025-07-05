import React, { useState, useRef, useEffect } from 'react';

interface CustomSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        className={`flex-1 p-3 rounded-md border text-left cursor-pointer flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-gray-800 border-gray-700 text-white'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="ml-2 text-gray-400">&#9660;</span> {/* Down arrow */}
      </button>

      {isOpen && (
        <ul className="absolute z-10 w-full bg-gray-900 border border-gray-700 rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
          {options.map((option, index) => (
            <li
              key={option.value}
              className={`p-3 cursor-pointer hover:bg-gray-700 text-gray-100 ${index < options.length - 1 ? 'border-b border-gray-800' : ''}`}
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
