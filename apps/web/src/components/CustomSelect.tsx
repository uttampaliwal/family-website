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
        className={`w-[180px] p-[8px] rounded-[4px] border border-solid border-[#ccc] text-left cursor-pointer flex justify-between items-center ${
          disabled ? 'bg-gray-200 cursor-not-allowed text-gray-400' : 'bg-[#ffffff] text-[#213547] dark:bg-[#242424] dark:text-[rgba(255,255,255,0.87)] dark:border-[#ccc]'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="ml-2">&#9660;</span> {/* Down arrow */}
      </button>

      {isOpen && (
        <ul className="absolute z-10 w-full bg-[#ffffff] border border-solid border-[#ccc] rounded-[4px] mt-1 max-h-60 overflow-auto shadow-lg dark:bg-[#242424] dark:border-[#ccc]">
          {options.map((option) => (
            <li
              key={option.value}
              className="p-[8px] cursor-pointer hover:bg-gray-100 text-[#213547] dark:text-[rgba(255,255,255,0.87)] dark:hover:bg-gray-700"
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
