# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Frontend Development and Email Verification Flow

This section details key aspects of frontend development, particularly focusing on environment configuration and the enhanced email verification process.

### 1. Environment Variables

The frontend application uses environment variables, primarily for configuring the API base URL. These variables are defined in a `.env` file located in the `apps/web` directory.

*   `VITE_API_BASE_URL`: The base URL of your backend API (e.g., `http://localhost:3001`).
    *   **Important:** For multi-device access (e.g., testing on a mobile phone), this *must* be your development machine's local IP address (e.g., `http://192.168.1.8:3001`), not `http://localhost:3001`.

**Example `.env` file:**

```
VITE_API_BASE_URL=http://192.168.1.8:3001
```

### 2. Email Verification Flow Enhancements

The email verification process has been enhanced to provide a better user experience and handle various scenarios.

*   **`src/pages/LoginPage.tsx`:**
    *   **"Resend Verification Email" Button:** When a user attempts to log in with an unverified email, the login page now displays a "Resend Verification Email" button.
    *   **`handleResendVerification` Function:** This new function handles the logic for resending the verification email. It makes a POST request to the backend's `/api/auth/resend-verification` endpoint, passing the user's identifier.
*   **`src/pages/VerifyEmailPage.tsx`:**
    *   **`useRef` for Single Execution:** A `useRef` hook (`hasVerified`) has been implemented to ensure that the email verification logic is executed only once, preventing multiple verification attempts and potential race conditions.
    *   **POST Request for Verification:** The verification request sent to the backend's `/api/auth/verify-email` endpoint has been updated to use a POST method, with the `verificationToken` sent in the request body. This aligns with the backend's security requirements.

### 3. Multi-Device Access (Vite Configuration)

For testing the frontend application on multiple devices within the same network (e.g., mobile phones), the Vite development server is configured to listen on all network interfaces.

*   **`vite.config.ts`:** The `server.host: '0.0.0.0'` configuration ensures that the frontend development server is accessible from other devices using your development machine's local IP address.