import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";

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
  container: "relative",
  button: {
    base: "input flex justify-between items-center text-left cursor-pointer",
    enabled: "",
    disabled: "cursor-not-allowed opacity-70",
  },
  dropdown:
    "absolute z-10 w-full bg-surface border border-border rounded-md mt-1 max-h-60 overflow-auto shadow-lg",
  option: "p-3 cursor-pointer hover:bg-primary hover:text-on-primary text-base",
  optionBorder: "border-b border-border",
  arrow: "ml-2 text-muted",
} as const;

const DROPDOWN_ARROW = "▼";
const DEFAULT_PLACEHOLDER = "Select an option";

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const buttonClasses = `${STYLES.button.base} ${disabled ? STYLES.button.disabled : STYLES.button.enabled}`;

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      selectRef.current &&
      !selectRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
            const optionClasses = `${STYLES.option} ${!isLastOption ? STYLES.optionBorder : ""}`;

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
