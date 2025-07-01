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
│   │   ├── Button.css
│   │   └── Button.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── SignInPage.tsx
│   │   └── SignUpPage.tsx
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
├── tailwind.config.js
└── tsconfig.json
```
```

## 4. Styling and Design System

We will use Tailwind CSS for all styling. A design system will be defined in `tailwind.config.js` to ensure consistency in colors, fonts, spacing, and other visual elements.

*   **Colors:** A primary color palette will be defined and used throughout the application.
*   **Typography:** We will use a consistent set of font sizes, weights, and line heights.
*   **Spacing:** A consistent spacing scale will be used for margins, padding, and other layout properties.
*   **Components:** We will build a library of reusable components with consistent styling.

## 5. Styling Guidelines

*   **Utility-First CSS:** Tailwind CSS v4.1 is used for all styling, promoting a utility-first approach. Custom CSS should be minimized and only used for global styles or complex components where Tailwind utilities are insufficient.
*   **Responsive Design:** All components should be designed with responsiveness in mind, utilizing Tailwind's responsive utility variants (e.g., `sm:`, `md:`, `lg:`).
*   **Theming:** A dark mode toggle will be implemented. Tailwind's dark mode variant will be used.

## 6. Visual Design Principles

The overall visual design aims for a clean, modern, and user-friendly aesthetic. Key elements will draw inspiration from the default Vite React application's initial design, particularly for interactive elements like buttons.

### Button Styling

Buttons, especially for core actions like "Sign In" and "Sign Up," will adopt a style similar to the "count is 0" button found in the default Vite React template. This includes:

*   **Rounded Corners:** Slightly rounded borders for a softer look.
*   **Subtle Border:** A thin, subtle border that changes color on hover.
*   **Padding:** Generous padding for comfortable click areas.
*   **Font:** Inherited font family, medium weight.
*   **Background:** A dark background in dark mode, and a light background in light mode, with a subtle transition on hover.
*   **Focus Outline:** A clear focus outline for accessibility.

This styling will be applied using Tailwind CSS classes, ensuring consistency across the application.

## 7. Component Structure

Components are organized into logical directories:

*   `src/components`: Reusable UI components (e.g., Button, Modal, Card).
    *   `Button.tsx`: A reusable button component with styling inspired by the default Vite React template.
    *   `Button.css`: Stylesheet for the `Button` component.
*   `src/pages`: Top-level components representing different views/pages of the application (e.g., HomePage, LoginPage, DashboardPage).
    *   `HomePage.tsx`: The main landing page, now revamped to integrate with backend data.
    *   `SignInPage.tsx`: Handles user sign-in with form for email/password and API integration. Includes client-side email format validation, loading states, improved messages, and redirection after successful sign-in.
    *   `SignUpPage.tsx`: Handles user registration with form for name, email, password, and confirm password. Includes robust client-side validation for email format and password strength (minimum 8 characters, at least one uppercase, lowercase, number, and special character), password matching, loading states, improved messages, and redirection after successful sign-up.
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

### Why Not Next.js (for this project's current phase)?

While Next.js is a powerful and popular React framework offering comprehensive features for production-ready applications (SSR, SSG, API Routes, etc.), it was not the optimal choice for the initial learning phase of this project due to:

*   **Increased Complexity:** Next.js introduces a steeper learning curve with its various rendering strategies and opinionated structure, which could detract from the primary goal of learning core full-stack concepts.
*   **Redundant Features:** Its integrated backend features are not required given the existing separate Express.js API.
*   **Frequent Paradigm Shifts:** Next.js's rapid evolution and frequent introduction of new concepts can lead to a more volatile development environment, which is less ideal for a foundational learning project.

### Conclusion

Both Vite and Next.js are excellent, modern technologies capable of building high-quality web applications. However, for this project's specific context—a learning-focused endeavor with a decoupled frontend and backend—Vite provides a more streamlined, efficient, and focused development experience, allowing for a deeper understanding of core web development principles without unnecessary abstraction or complexity. The choice reflects a commitment to simplicity, maintainability, and a clear separation of concerns, which are crucial for long-term project health and developer productivity.

By following this guide, we can create a high-quality, maintainable, and scalable frontend for the family website.