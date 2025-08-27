import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { updateUserProfile } from "../services/auth";
import { ensureCsrfToken } from "../utils/csrf";
import CustomSelect from "./CustomSelect";

interface RelationshipManagerProps {
  currentRelationship?: string;
  onUpdate: (newRelationship: string) => void;
}

const RELATIONSHIP_OPTIONS = [
  { value: "self", label: "Self" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "brother", label: "Brother" },
  { value: "sister", label: "Sister" },
  { value: "husband", label: "Husband" },
  { value: "wife", label: "Wife" },
  { value: "grandfather", label: "Grandfather" },
  { value: "grandmother", label: "Grandmother" },
  { value: "uncle", label: "Uncle" },
  { value: "aunt", label: "Aunt" },
  { value: "cousin", label: "Cousin" },
  { value: "nephew", label: "Nephew" },
  { value: "niece", label: "Niece" },
  { value: "son-in-law", label: "Son-in-law" },
  { value: "daughter-in-law", label: "Daughter-in-law" },
  { value: "brother-in-law", label: "Brother-in-law" },
  { value: "sister-in-law", label: "Sister-in-law" },
  { value: "other", label: "Other" },
];

const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  currentRelationship,
  onUpdate,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState(
    currentRelationship || "self",
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      showToast("You must be logged in to update your relationship", "error");
      return;
    }

    if (selectedRelationship === currentRelationship) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      await ensureCsrfToken();

      const updateData = {
        relationship: selectedRelationship,
      };

      await updateUserProfile(user.username, updateData);

      onUpdate(selectedRelationship);
      setIsEditing(false);
      showToast("Relationship updated successfully!", "success");
    } catch (error: unknown) {
      console.error("Error updating relationship:", error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to update relationship";
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedRelationship(currentRelationship || "self");
    setIsEditing(false);
  };

  const getRelationshipLabel = (value: string) => {
    const option = RELATIONSHIP_OPTIONS.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  if (!isEditing) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-base">
            Relationship with Uttam Paliwal
          </h3>
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-ghost btn-sm"
          >
            Edit
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">
              {selectedRelationship === "self"
                ? "👤"
                : selectedRelationship === "father"
                  ? "👨"
                  : selectedRelationship === "mother"
                    ? "👩"
                    : selectedRelationship === "son"
                      ? "👦"
                      : selectedRelationship === "daughter"
                        ? "👧"
                        : selectedRelationship === "brother"
                          ? "👨‍💼"
                          : selectedRelationship === "sister"
                            ? "👩‍💼"
                            : selectedRelationship === "husband"
                              ? "👨‍❤️‍👨"
                              : selectedRelationship === "wife"
                                ? "👩‍❤️‍👩"
                                : selectedRelationship === "grandfather"
                                  ? "👴"
                                  : selectedRelationship === "grandmother"
                                    ? "👵"
                                    : selectedRelationship === "uncle"
                                      ? "👨‍💼"
                                      : selectedRelationship === "aunt"
                                        ? "👩‍💼"
                                        : selectedRelationship === "cousin"
                                          ? "👤"
                                          : selectedRelationship === "nephew"
                                            ? "👦"
                                            : selectedRelationship === "niece"
                                              ? "👧"
                                              : "👤"}
            </span>
          </div>
          <div>
            <p className="font-medium text-base">
              {getRelationshipLabel(selectedRelationship)}
            </p>
            <p className="text-sm text-muted">
              Your relationship status in the family tree
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-border">
      <h3 className="text-lg font-semibold text-base mb-4">
        Update Relationship with Uttam Paliwal
      </h3>

      <div className="space-y-4">
        <div className="form-group">
          <label className="form-label">
            What is your relationship with Uttam Paliwal (S/O Ravi Paliwal)?
          </label>
          <CustomSelect
            options={RELATIONSHIP_OPTIONS}
            value={selectedRelationship}
            onChange={setSelectedRelationship}
            placeholder="Select your relationship"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelationshipManager;
