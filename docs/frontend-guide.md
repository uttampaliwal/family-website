# Frontend Guide

This document provides a comprehensive guide to the frontend application of the Family Website project, built with React, TypeScript, and Vite.

## Directory Structure

```
web/
├── public/            # Static assets
├── src/
│   ├── api/           # API client
│   │   └── axios.ts   # Axios configuration
│   ├── assets/        # Frontend assets
│   ├── components/    # React components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Main App component
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── .env               # Environment variables
└── ...                # Configuration files
```

## Key Components

### Authentication Components

#### `AuthButtons.tsx`

Handles the display and functionality of login/register buttons.

```tsx
// Example usage
<AuthButtons />
```

#### `ProtectedRoute.tsx`

A React component used to protect routes, ensuring only authenticated users can access certain pages.

```tsx
// Example usage
<ProtectedRoute>
  <UserProfilePage />
</ProtectedRoute>
```

### Form Components

#### `AccountInformationForm.tsx`

Form component for account information (email, username, password).

#### `PersonalDetailsForm.tsx`

Form component for personal details (name, date of birth, mobile number, gender).

#### `DateOfBirthPicker.tsx`

Component for selecting a date of birth, composed of day, month, and year dropdowns.

```tsx
// Example usage
<DateOfBirthPicker value={dateOfBirth} onChange={handleDateOfBirthChange} />
```

#### `CustomSelect.tsx`

A custom dropdown select component for improved styling and functionality.

```tsx
// Example usage
<CustomSelect
  options={genderOptions}
  value={gender}
  onChange={handleGenderChange}
  placeholder="Select Gender"
/>
```

### UI Components

#### `Button.tsx`

Reusable button component with primary and secondary styles.

```tsx
// Example usage
<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>
```

#### `ThemeToggleButton.tsx`

Button for toggling between light and dark modes.

```tsx
// Example usage
<ThemeToggleButton />
```

#### `Toast.tsx`

Component for displaying toast notifications.

```tsx
// Example usage
<Toast message="Profile updated successfully" type="success" />
```

#### `UserProfileCard.tsx`

Card component for displaying user profile information.

```tsx
// Example usage
<UserProfileCard user={user} />
```

#### `Skeleton.tsx` and `UserProfileSkeleton.tsx`

Components for displaying loading states.

```tsx
// Example usage
{
  isLoading ? <UserProfileSkeleton /> : <UserProfileCard user={user} />;
}
```

## Context Providers

### `AuthContext.tsx`

Provides authentication state and methods throughout the application.

```tsx
// Example usage
const { user, login, logout, register } = useAuth();
```

### `ToastContext.tsx`

Provides toast notification functionality throughout the application.

```tsx
// Example usage
const { showToast } = useToast();
showToast("Profile updated successfully", "success");
```

## Custom Hooks

### `useAuth.ts`

Hook for accessing authentication context.

```tsx
// Example usage
const { user, isAuthenticated, login, logout } = useAuth();
```

### `useFormValidation.ts`

Hook for form validation.

```tsx
// Example usage
const { errors, validateForm } = useFormValidation();
```

### `useToast.ts`

Hook for displaying toast notifications.

```tsx
// Example usage
const { showToast } = useToast();
```

## Pages

### `HomePage.tsx`

The main landing page of the application.

### `LoginPage.tsx`

User login interface.

### `RegisterPage.tsx`

User registration interface.

### `UserProfilePage.tsx`

Displays and allows editing of user profile information.

### `ForgotPasswordPage.tsx`

Interface for initiating password reset.

### `ResetPasswordPage.tsx`

Interface for setting a new password using a reset token.

### `VerifyEmailPage.tsx`

Page for email verification.

## API Integration

The frontend communicates with the backend API using Axios. The base configuration is defined in `src/api/axios.ts`.

```tsx
// Example API call
import api from "../api/axios";

const login = async (identifier: string, password: string) => {
  try {
    const response = await api.post("/auth/login", { identifier, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

## Theming

The application supports both light and dark modes. The theme is controlled by CSS variables defined in `src/index.css` and utilized by Tailwind CSS classes.

```tsx
// Example theme toggle
const toggleTheme = () => {
  const html = document.documentElement;
  if (html.classList.contains("dark")) {
    html.classList.remove("dark");
    localStorage.theme = "light";
  } else {
    html.classList.add("dark");
    localStorage.theme = "dark";
  }
};
```

## Environment Variables

The frontend application uses environment variables, primarily for configuring the API base URL. These variables are defined in a `.env` file located in the `apps/web` directory.

- `VITE_API_BASE_URL`: The base URL of your backend API (e.g., `http://localhost:3000`).

## Responsive Design

The frontend is built to be responsive, adapting to various screen sizes (mobile, tablet, desktop) using Tailwind CSS utility classes.

```tsx
// Example responsive component
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

## Authentication Flow

1. **Registration:**
   - User fills out registration form
   - Form data is validated
   - API request is sent to `/auth/register`
   - User is redirected to login page or verification page

2. **Email Verification:**
   - User clicks verification link in email
   - Frontend extracts verification token from URL
   - Token is sent to API for validation
   - User is redirected to login page on success

3. **Login:**
   - User enters email/username and password
   - Credentials are validated
   - API request is sent to `/auth/login`
   - On success, JWT token is stored and user is redirected to home page

4. **Password Reset:**
   - User requests password reset on login page
   - Email is sent with reset link
   - User clicks link and enters new password
   - Password is updated and user is redirected to login page
