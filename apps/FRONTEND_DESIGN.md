# Frontend Design and Development Guide

This document provides a comprehensive guide to the frontend architecture, design, and development process for the family website. Its purpose is to ensure consistency, maintainability, and a shared understanding of the frontend codebase.

## 1. Philosophy and Goals

The primary goal of the frontend is to provide a clean, modern, and intuitive user experience. The design should be responsive, accessible, and performant. We will adhere to the following principles:

*   **Simplicity:** Keep the design and codebase as simple as possible. Avoid unnecessary complexity.
*   **Consistency:** Maintain a consistent look and feel across the entire application.
*   **Reusability:** Build reusable components to reduce code duplication and improve development speed.
*   **Accessibility:** Ensure the application is usable by everyone, including people with disabilities.

## 2. Technology Stack

*   **Framework:** React with Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4.1 with PostCSS
*   **Routing:** React Router DOM
*   **State Management:** React Context API (for now)

## 3. Project Structure

The project follows a standard Vite project structure with some additions for better organization:

```
```
apps/web/
├── public/
│   └── vite.svg
│   └── family-logo.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── AuthButtons.tsx
│   │   ├── Button.css
│   │   ├── Button.tsx
│   │   └── CustomSelect.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── VerifyEmailPage.tsx
│   ├── routes/           # Route definitions
│   ├── services/         # API services
│   ├── styles/           # Global styles and Tailwind CSS configuration
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .gitignore
├── FRONTEND_DESIGN.md
├── index.html
├── package.json
├── postcss.config.js
└── tsconfig.json
```
```

## 4. Styling and Design System

We will use Tailwind CSS for all styling. While Tailwind CSS v4.1 does not use a traditional `tailwind.config.js` file for theme configuration, our design system is implicitly defined through the consistent application of Tailwind utility classes and direct color values derived from our global `index.css`.

*   **Colors:** Our primary color palette is defined in `index.css` and directly referenced in Tailwind classes (e.g., `bg-[#242424]`, `text-[rgba(255,255,255,0.87)]`). This ensures a single source of truth for colors and dynamic theming (light/dark mode).
*   **Typography:** Consistent font sizes (`text-[...]`), weights (`font-bold`, `font-medium`), and line heights are applied using Tailwind utilities.
*   **Spacing:** A consistent spacing scale is used for margins (`m-[...]`), padding (`p-[...]`), and other layout properties, leveraging Tailwind's built-in spacing scale.
*   **Components:** We build a library of reusable components (e.g., `Button`, `CustomSelect`) with styling applied directly via Tailwind classes, ensuring visual consistency and reusability.

## 5. Styling Guidelines

*   **Utility-First CSS:** Tailwind CSS v4.1 is used for all styling, promoting a utility-first approach. Custom CSS should be minimized and only used for global styles or complex components where Tailwind utilities are insufficient.
*   **Responsive Design:** All components should be designed with responsiveness in mind, utilizing Tailwind's responsive utility variants (e.g., `sm:`, `md:`, `lg:`).
*   **Theming:** A dark mode toggle will be implemented. Tailwind's dark mode variant will be used.

## 6. Visual Design Principles

The overall visual design aims for a clean, modern, and user-friendly aesthetic. Key elements will draw inspiration from the default Vite React application's initial design, particularly for interactive elements like buttons.

### Button Styling

Buttons, especially for core actions like "Login" and "Register," will adopt a style similar to the "count is 0" button found in the default Vite React template. This includes:

*   **Rounded Corners:** `rounded-[4px]` for a softer look.
*   **Subtle Border:** `border border-solid border-[#ccc]` for a thin, subtle border.
*   **Padding:** `p-[8px]` for comfortable click areas.
*   **Font:** Inherited font family, `font-medium` weight.
*   **Background:** `bg-white dark:bg-[#242424]` for a light background in light mode and a dark background in dark mode, with `hover:bg-gray-100 dark:hover:bg-gray-700` for a subtle transition on hover.
*   **Text Color:** `text-black dark:text-[rgba(255,255,255,0.87)]` for text color that adapts to the theme.
*   **Focus Outline:** A clear focus outline for accessibility (handled by browser defaults or global styles).

This styling will be applied using Tailwind CSS classes, ensuring consistency across the application.

## 7. Component Structure

Components are organized into logical directories:

*   `src/components`: Reusable UI components (e.g., Button, Modal, Card).
    *   `AuthButtons.tsx`: A new component responsible for conditionally rendering the "Login" and "Register" buttons based on the current route.
    *   `Button.tsx`: A reusable button component with styling inspired by the default Vite React template.
    *   `Button.css`: Stylesheet for the `Button` component.
    *   `CustomSelect.tsx`: A custom select component to replace native HTML select elements for improved styling and theming.
*   `src/pages`: Top-level components representing different views/pages of the application (e.g., HomePage, LoginPage, DashboardPage).
    *   `HomePage.tsx`: The main landing page, now revamped to integrate with backend data.
    *   `LoginPage.tsx`: Handles user login with form for email/password and API integration. Includes client-side email format validation, loading states, improved messages, and redirection after successful login. Now redirects to register if user is not found. Includes a link to switch to the register page.
    *   `RegisterPage.tsx`: Handles user registration with form for name, email, password, and confirm password. Includes robust client-side validation for email format and password strength (minimum 8 characters, at least one uppercase, lowercase, number, and special character), password matching, loading states, improved messages, and redirection after successful registration. Form is now centered. Uses a custom select component for the gender field. Includes a link to switch to the login page.
    *   `VerifyEmailPage.tsx`: Handles email verification by processing the token from the URL, communicating with the backend, and providing user feedback.
*   `src/features`: (Future) Components and logic related to specific features (e.g., authentication, user profiles, blog posts).

## 8. Development Process

1.  **Create a new branch:** Before starting a new feature or bug fix, create a new branch from `main`.
2.  **Create or update components and pages:** Follow the project structure and coding conventions.
3.  **Write tests:** Write unit and integration tests for all new code.
4.  **Update documentation:** Update this document and any other relevant documentation.
5.  **Create a pull request:** Once the feature or bug fix is complete, create a pull request to merge the changes into `main`.

## 9. Vite vs. Next.js: A Deliberate Choice

During the project's inception, a deliberate decision was made to utilize **React with Vite** for the frontend, rather than Next.js. This choice was guided by the project's primary goal of learning full-stack web development and the existing architectural decision to maintain a separate backend (Node.js with Express.js).

### Why Vite?

*   **Fast Development Experience:** Vite leverages native ES modules, providing extremely fast cold starts and Hot Module Replacement (HMR). This significantly accelerates the development loop, allowing for rapid iteration and a more interactive coding experience.
*   **Lightweight and Flexible:** Vite is a build tool, not a full-fledged framework. This offers greater flexibility in project structure and the choice of libraries, aligning with a preference for less opinionated tooling.
*   **Focus on Core React Concepts:** By using Vite, developers can concentrate on mastering React fundamentals, TypeScript, and styling with Tailwind CSS in a client-side context, without the added complexity of Next.js's server-side rendering (SSR) or static site generation (SSG) paradigms.
*   **Separate Backend Alignment:** Given that the project already employs a dedicated Node.js Express backend, Next.js's built-in API routes and integrated full-stack features would be redundant and introduce unnecessary coupling. Maintaining a clear separation of concerns between frontend and backend is prioritized for scalability and maintainability.
*   **Tailwind CSS v4.1 Compatibility:** Vite's PostCSS integration makes it an ideal environment for using Tailwind CSS v4.1 as a PostCSS plugin, ensuring efficient and optimized CSS generation.

### Why Not Next.js (for this project's current phase)?

While Next.js is a powerful and popular React framework offering comprehensive features for production-ready applications (SSR, SSG, API Routes, etc.), it was not the optimal choice for the initial learning phase of this project due to:

*   **Increased Complexity:** Next.js introduces a steeper learning curve with its various rendering strategies and opinionated structure, which could detract from the primary goal of learning core full-stack concepts.
*   **Redundant Features:** Its integrated backend features are not required given the existing separate Express.js API.
*   **Frequent Paradigm Shifts:** Next.js's rapid evolution and frequent introduction of new concepts can lead to a more volatile development environment, which is less ideal for a foundational learning project.

### Conclusion

Both Vite and Next.js are excellent, modern technologies capable of building high-quality web applications. However, for this project's specific context—a learning-focused endeavor with a decoupled frontend and backend—Vite provides a more streamlined, efficient, and focused development experience, allowing for a deeper understanding of core web development principles without unnecessary abstraction or complexity. The choice reflects a commitment to simplicity, maintainability, and a clear separation of concerns, which are crucial for long-term project health and developer productivity.

By following this guide, we can create a high-quality, maintainable, and scalable frontend for the family website.

**Checkpoint:** A project checkpoint has been created: [family-website-checkpoint.zip](../../family-website-checkpoint.zip)

## 10. Version History

- **v0.1.0 (July 2, 2025):** Initial release with basic login and register pages, and foundational project structure.
- **v0.0.2 (July 2, 2025):** Extensive refactoring of inline styles to Tailwind CSS classes; implementation of custom `CustomSelect` component; improved frontend validation; standardization of "Sign Up" to "Register" and "Sign In" to "Login" terminology.
- **v0.0.3 (July 2, 2025):**
    - Configured API endpoint in `RegisterPage.tsx` via environment variables.
    - Improved network error handling with retry mechanisms in `RegisterPage.tsx`.
    - Enhanced form accessibility with ARIA attributes in `RegisterPage.tsx`.
    - Implemented memoization (`useCallback`) for event handlers in `RegisterPage.tsx`.
    - Added a note for logo image optimization in `App.tsx` and `README.md`.