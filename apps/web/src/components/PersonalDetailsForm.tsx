import React from "react";
import { useFormContext } from "react-hook-form";
import { GENDER_OPTIONS } from "../lib/gender";

interface PersonalDetailsFormProps {
  loading: boolean;
}

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({
  loading,
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-base mb-2"
        >
          Full Name <span className="text-error">*</span>
        </label>
        <input
          type="text"
          id="name"
          {...register("name")}
          required
          disabled={loading}
          className="input"
          placeholder="Enter your full name"
        />
        {errors.name && (
          <p className="text-error text-sm mt-1">
            {errors.name.message as string}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="dob"
          className="block text-sm font-medium text-base mb-2"
        >
          Date of Birth <span className="text-error">*</span>
        </label>
        <input
          type="date"
          id="dob"
          {...register("dob")}
          required
          disabled={loading}
          className="input"
        />
        {errors.dob && (
          <p className="text-error text-sm mt-1">
            {errors.dob.message as string}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="mobileNumber"
          className="block text-sm font-medium text-base mb-2"
        >
          Mobile Number
        </label>
        <input
          type="tel"
          id="mobileNumber"
          {...register("mobileNumber")}
          disabled={loading}
          className="input"
          placeholder="Enter your mobile number"
        />
      </div>
      <div>
        <label
          htmlFor="gender"
          className="block text-sm font-medium text-base mb-2"
        >
          Gender <span className="text-error">*</span>
        </label>
        <select
          id="gender"
          {...register("gender")}
          required
          disabled={loading}
          className="input"
        >
          {GENDER_OPTIONS(true).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.gender && (
          <p className="text-error text-sm mt-1">
            {errors.gender.message as string}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="relationship"
          className="block text-sm font-medium text-base mb-2"
        >
          What is your relationship with Uttam Paliwal (S/O Ravi Paliwal)?{" "}
          <span className="text-error">*</span>
        </label>
        <select
          id="relationship"
          {...register("relationship")}
          required
          disabled={loading}
          className="input"
        >
          <option value="">Select relationship</option>
          <option value="self">Self</option>
          <option value="father">Father</option>
          <option value="mother">Mother</option>
          <option value="son">Son</option>
          <option value="daughter">Daughter</option>
          <option value="brother">Brother</option>
          <option value="sister">Sister</option>
          <option value="husband">Husband</option>
          <option value="wife">Wife</option>
          <option value="grandfather">Grandfather</option>
          <option value="grandmother">Grandmother</option>
          <option value="uncle">Uncle</option>
          <option value="aunt">Aunt</option>
          <option value="cousin">Cousin</option>
          <option value="nephew">Nephew</option>
          <option value="niece">Niece</option>
          <option value="son-in-law">Son-in-law</option>
          <option value="daughter-in-law">Daughter-in-law</option>
          <option value="brother-in-law">Brother-in-law</option>
          <option value="sister-in-law">Sister-in-law</option>
          <option value="other">Other</option>
        </select>
        {errors.relationship && (
          <p className="text-error text-sm mt-1">
            {errors.relationship.message as string}
          </p>
        )}
      </div>
    </div>
  );
};

export default PersonalDetailsForm;
