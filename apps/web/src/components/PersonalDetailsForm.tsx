import React, { useCallback } from "react";
import Button from "./Button";
import CustomSelect from "./CustomSelect";
import DateOfBirthPicker from "./DateOfBirthPicker";
import { GENDER_OPTIONS } from "../lib/gender";

interface PersonalDetailsFormProps {
  name: string;
  setName: (name: string) => void;
  dob: string;
  setDob: (dob: string) => void;
  mobileNumber: string;
  setMobileNumber: (mobileNumber: string) => void;
  gender: string;
  setGender: (gender: string) => void;
  loading: boolean;
  nameRef: React.RefObject<HTMLInputElement | null>;
  handleNext: () => void;
}

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({
  name,
  setName,
  dob,
  setDob,
  mobileNumber,
  setMobileNumber,
  gender,
  setGender,
  loading,
  nameRef,
  handleNext,
}) => {
  const handleMobileNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^+\d\s()-]/g, "");
      setMobileNumber(value);
    },
    [setMobileNumber],
  );
  return (
    <div className="mb-8 card">
      <h2 className="headline mb-6 text-on-surface">Personal Details</h2>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
        <label
          htmlFor="name"
          className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300"
        >
          Name:
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-required="true"
          disabled={loading}
          ref={nameRef}
          className="input"
        />
      </div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
        <label
          htmlFor="dob"
          className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300"
        >
          DOB:
        </label>
        <DateOfBirthPicker value={dob} onChange={setDob} disabled={loading} />
      </div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
        <label
          htmlFor="mobileNumber"
          className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300"
        >
          Mobile Number:
        </label>
        <input
          type="tel"
          id="mobileNumber"
          value={mobileNumber}
          onChange={handleMobileNumberChange}
          disabled={loading}
          pattern="[+]?[0-9\s()-]{10,15}"
          title="Please enter a valid phone number (10-15 digits)"
          className="input"
        />
      </div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
        <label
          htmlFor="gender"
          className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300"
        >
          Gender:
        </label>
        <CustomSelect
          options={GENDER_OPTIONS(true)}
          value={gender}
          onChange={setGender}
          placeholder="Select Gender"
          disabled={loading}
          className="flex-1"
        />
      </div>
      <div className="text-right mt-6">
        <Button
          label="Next"
          onClick={() => {
            if (!name.trim()) {
              nameRef.current?.focus();
              return;
            }
            if (!dob) {
              return;
            }
            handleNext();
          }}
          disabled={loading}
          type="button"
          variant="primary"
        />
      </div>
    </div>
  );
};

export default React.memo(PersonalDetailsForm);
