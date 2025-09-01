import type { UserProfile } from "../types/api";

export type ProfileState = {
  userProfile: UserProfile | null;
  editableProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isEditing: boolean;
};

export type ProfileAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: UserProfile }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "EDIT_START" }
  | { type: "EDIT_CANCEL" }
  | { type: "EDIT_SAVE"; payload: UserProfile };

export const userProfileReducer = (
  state: ProfileState,
  action: ProfileAction,
): ProfileState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        userProfile: action.payload,
        editableProfile: action.payload,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "EDIT_START":
      return { ...state, isEditing: true };
    case "EDIT_CANCEL":
      return { ...state, isEditing: false, editableProfile: state.userProfile };
    case "EDIT_SAVE":
      return {
        ...state,
        isEditing: false,
        userProfile: action.payload,
        editableProfile: action.payload,
      };
    default:
      return state;
  }
};
