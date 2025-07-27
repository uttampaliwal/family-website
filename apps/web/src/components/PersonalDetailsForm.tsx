import React from 'react';
import Button from './Button';
import CustomSelect from './CustomSelect';
import DateOfBirthPicker from './DateOfBirthPicker';

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
  return (
    <div className="mb-8 p-8 bg-white dark:bg-gray-900 rounded-xl shadow-xl">
      <h2 className="text-2xl font-extrabold mb-6 text-gray-800 dark:text-gray-100">Personal Details</h2>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
        <label htmlFor="name" className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300">Name:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => {
            try {
              setName(e.target.value);
            } catch (error) {
              console.error('Error updating name:', error);
            }
          }}
          required
          aria-required="true"
          disabled={loading}
          ref={nameRef}
          className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
        <label htmlFor="dob" className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300">DOB:</label>
        <DateOfBirthPicker
          value={dob}
          onChange={setDob}
          disabled={loading}
        />
      </div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
        <label htmlFor="mobileNumber" className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300">Mobile Number:</label>
        <input
          type="tel"
          id="mobileNumber"
          value={mobileNumber}
          onChange={(e) => {
            try {
              setMobileNumber(e.target.value);
            } catch (error) {
              console.error('Error updating mobile number:', error);
            }
          }}
          disabled={loading}
          className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
        <label htmlFor="gender" className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300">Gender:</label>
        <CustomSelect
          options={[
            { value: '', label: 'Select Gender' },
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
            { value: 'Prefer not to say', label: 'Prefer not to say' },
          ]}
          value={gender}
          onChange={setGender}
          placeholder="Select Gender"
          disabled={loading}
          className="flex-1"
        />
      </div>
      <div className="text-right mt-6">
        <Button label="Next" onClick={handleNext} disabled={loading} type="button" />
      </div>
    </div>
  );
};

export default React.memo(PersonalDetailsForm);