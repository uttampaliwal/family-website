# Design System & Style Guide

**Family Portal Website - Version 0.2.5**

---

## 🎨 Color System

### Semantic Color Usage

Our color system uses CSS custom properties for consistent theming across light and dark modes.

#### Primary Colors

```css
/* Light Mode */
--color-primary: 30 58 138 (Royal Blue) --color-secondary: 202 138 4 (Dark Gold)
  --color-accent: 59 130 246 (Bright Blue) /* Dark Mode */ --color-primary: 250
  204 21 (Bright Gold) --color-secondary: 96 165 250 (Soft Blue)
  --color-accent: 234 179 8 (Yellow);
```

#### Text Colors

```css
/* Light Mode */
--color-text-base: 15 23 42 (Slate 900) - Primary text --color-text-muted: 51 65
  85 (Slate 700) - Secondary text --color-text-light: 100 116 139 (Slate 500) -
  Tertiary text /* Dark Mode */ --color-text-base: 248 250 252 (Slate 50) -
  Primary text --color-text-muted: 203 213 225 (Slate 300) - Secondary text;
```

#### Status Colors

```css
/* Both modes have light/dark variants */
Success: Green (700 light, 400 dark)
Warning: Amber (700 light, 400 dark)
Error: Red (700 light, 400 dark)
Info: Cyan (700 light, 400 dark)
```

### Color Application Guide

| Element   | Class                        | Usage                         |
| --------- | ---------------------------- | ----------------------------- |
| Headings  | `text-text-base`             | Main headings, important text |
| Body text | `text-text-base`             | Regular paragraph text        |
| Captions  | `text-text-muted`            | Helper text, timestamps       |
| Disabled  | `text-text-muted opacity-50` | Disabled state                |
| Links     | `text-primary`               | Clickable links               |
| Errors    | `text-error`                 | Error messages                |

---

## 📏 Spacing Scale

Use consistent spacing throughout the app:

```css
/* Spacing Variables (Proposed) */
--spacing-xs: 0.25rem /* 4px */ --spacing-sm: 0.5rem /* 8px */
  --spacing-md: 1rem /* 16px */ --spacing-lg: 1.5rem /* 24px */
  --spacing-xl: 2rem /* 32px */ --spacing-2xl: 3rem /* 48px */
  --spacing-3xl: 4rem /* 64px */;
```

### Recommended Usage

| Element           | Spacing      | Example            |
| ----------------- | ------------ | ------------------ |
| Component padding | `md` - `lg`  | `p-4` to `p-6`     |
| Section margins   | `xl` - `3xl` | `mb-8` to `mb-16`  |
| Button padding    | `sm` - `md`  | `px-4 py-2`        |
| Card padding      | `lg` - `xl`  | `p-6` to `p-8`     |
| Grid gaps         | `md` - `lg`  | `gap-4` to `gap-6` |

---

## ✏️ Typography System

### Type Scale

```css
/* Display (Hero text) */
.display-1: 3rem (48px) - 2.25rem (36px) on mobile
.display-2: 2.5rem (40px) - 1.875rem (30px) on mobile

/* Headings */
.headline: 2rem (32px) - 1.5rem (24px) on mobile
.subheadline: 1.5rem (24px) - 1.125rem (18px) on mobile

/* Body */
.body-lg: 1.125rem (18px)
.body-base: 1rem (16px) - Default
.body-sm: 0.875rem (14px)
```

### Font Weights

```css
--font-light: 300 --font-regular: 400 --font-medium: 500 --font-semibold: 600
  --font-bold: 700 --font-extrabold: 800;
```

### Line Heights

```css
--leading-tight: 1.1 (Headings) --leading-normal: 1.5 (Body)
  --leading-relaxed: 1.75 (Long-form content);
```

### Usage Examples

```tsx
// Page title
<h1 className="display-1 text-text-base font-extrabold mb-4">
  Welcome to Family Portal
</h1>

// Section heading
<h2 className="headline text-text-base font-bold mb-6">
  Recent Activity
</h2>

// Card title
<h3 className="text-xl font-semibold text-text-base mb-2">
  Weather Widget
</h3>

// Body text
<p className="body-base text-text-base leading-relaxed">
  This is standard paragraph text.
</p>

// Caption
<p className="body-sm text-text-muted">
  Posted 2 hours ago
</p>
```

---

## 🎯 Component System

### Buttons

#### Variants

```tsx
// Primary - Main actions
<button className="btn btn-primary">Save Changes</button>

// Secondary - Alternative actions
<button className="btn btn-secondary">Cancel</button>

// Ghost - Subtle actions
<button className="btn btn-ghost">Learn More</button>

// Error - Destructive actions
<button className="btn btn-error">Delete</button>

// Success - Positive confirmation
<button className="btn btn-success">Confirm</button>
```

#### Sizes

```tsx
// Small
<button className="btn btn-primary btn-sm">Small</button>

// Default
<button className="btn btn-primary">Default</button>

// Large
<button className="btn btn-primary btn-lg">Large</button>
```

#### States

```tsx
// Disabled
<button className="btn btn-primary" disabled>Disabled</button>

// Loading
<button className="btn btn-primary btn-loading">Loading...</button>
```

### Cards

#### Basic Card

```tsx
<div className="card">
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-text-muted">Card content goes here.</p>
</div>
```

#### Interactive Card

```tsx
<div className="card card-interactive">
  {/* Clickable card with hover effect */}
</div>
```

#### Elevated Card

```tsx
<div className="card card-elevated">{/* Card with stronger shadow */}</div>
```

### Form Elements

#### Input Field

```tsx
<div className="form-group">
  <label className="form-label" htmlFor="email">
    Email Address
  </label>
  <input
    type="email"
    id="email"
    className="form-input"
    placeholder="you@example.com"
  />
</div>
```

#### Input with Error

```tsx
<div className="form-group">
  <label className="form-label" htmlFor="email">
    Email Address
  </label>
  <input
    type="email"
    id="email"
    className="form-input form-input-error"
    placeholder="you@example.com"
  />
  <p className="form-error-message">Please enter a valid email</p>
</div>
```

#### Checkbox

```tsx
<label className="flex items-center gap-2">
  <input type="checkbox" className="form-checkbox" />
  <span className="text-text-base">Remember me</span>
</label>
```

---

## 🎭 Animations & Transitions

### Standard Transitions

```css
/* Fast - Hover states */
transition: all 0.15s ease-in-out;

/* Base - Most interactions */
transition: all 0.2s ease-in-out;

/* Slow - Complex animations */
transition: all 0.3s ease-in-out;

/* Custom - Smooth */
transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

### Framer Motion Variants

Use the standardized animation variants from `utils/animations.ts`:

```tsx
import { fadeInUp, scaleIn, staggerChildren } from '../utils/animations';

// Fade in with upward motion
<motion.div variants={fadeInUp} initial="initial" animate="animate">
  Content
</motion.div>

// Scale in
<motion.div variants={scaleIn} initial="initial" animate="animate">
  Modal
</motion.div>

// Stagger children
<motion.div variants={staggerChildren}>
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

### Hover Effects

```css
/* Lift on hover */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Scale on hover */
.btn:hover {
  transform: scale(1.02);
}

/* Brightness on hover (for colored buttons) */
.btn-primary:hover {
  filter: brightness(1.1);
}
```

---

## 📐 Layout Patterns

### Container

```tsx
<div className="container mx-auto px-4 py-8">
  {/* Centered content with consistent padding */}
</div>
```

### Section

```tsx
<section className="mb-12">
  <h2 className="headline mb-6">Section Title</h2>
  {/* Section content */}
</section>
```

### Grid Layouts

```tsx
// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {items.map((item) => (
    <div key={item.id} className="card">
      {/* Card content */}
    </div>
  ))}
</div>
```

### Flex Layouts

```tsx
// Center content
<div className="flex items-center justify-center min-h-screen">
  {/* Centered content */}
</div>

// Space between
<div className="flex justify-between items-center">
  <h2>Title</h2>
  <button className="btn btn-primary">Action</button>
</div>
```

---

## 🌓 Dark Mode Support

All components automatically support dark mode through CSS variables.

### Testing Dark Mode

```tsx
// Add dark class to html element
document.documentElement.classList.add("dark");

// Remove dark class
document.documentElement.classList.remove("dark");
```

### Dark Mode Specific Styles

```css
/* Automatic with CSS variables */
.card {
  background-color: rgb(var(--color-surface));
  color: rgb(var(--color-text-base));
}

/* Manual override when needed */
.dark .custom-element {
  /* Dark mode specific styles */
}
```

---

## ♿ Accessibility Guidelines

### Minimum Requirements

1. **Color Contrast**
   - Normal text: 4.5:1
   - Large text (18px+): 3:1
   - Interactive elements: 3:1

2. **Touch Targets**
   - Minimum size: 44x44px
   - Adequate spacing between targets

3. **Keyboard Navigation**
   - All interactive elements must be keyboard accessible
   - Visible focus indicators required
   - Logical tab order

4. **Screen Readers**
   - Semantic HTML elements
   - Proper ARIA labels
   - Alt text for images

### Implementation

```tsx
// Proper button
<button
  className="btn btn-primary"
  aria-label="Save your changes"
>
  Save
</button>

// Link with proper semantics
<Link
  to="/profile"
  className="link"
  aria-current={isActive ? 'page' : undefined}
>
  Profile
</Link>

// Image with alt text
<img
  src="/avatar.jpg"
  alt="User profile avatar for John Doe"
  className="w-12 h-12 rounded-full"
/>

// Form input with label
<label htmlFor="email" className="form-label">
  Email Address
</label>
<input
  id="email"
  type="email"
  className="form-input"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <p id="email-error" className="form-error-message" role="alert">
    Please enter a valid email
  </p>
)}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
/* Default: < 640px */

/* sm: >= 640px (Tablet portrait) */
@media (min-width: 640px) {
}

/* md: >= 768px (Tablet landscape) */
@media (min-width: 768px) {
}

/* lg: >= 1024px (Desktop) */
@media (min-width: 1024px) {
}

/* xl: >= 1280px (Large desktop) */
@media (min-width: 1280px) {
}

/* 2xl: >= 1536px (Extra large) */
@media (min-width: 1536px) {
}
```

### Usage

```tsx
// Mobile first: 1 col mobile, 2 tablet, 4 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Hide on mobile, show on desktop
<div className="hidden lg:block">
  Desktop only content
</div>

// Show on mobile, hide on desktop
<div className="block lg:hidden">
  Mobile only content
</div>

// Responsive text sizes
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
  Responsive Heading
</h1>
```

---

## 🔧 Common Patterns

### Loading State

```tsx
<div className="card animate-pulse" role="status" aria-label="Loading">
  <div className="h-8 bg-surface rounded w-1/2 mb-4"></div>
  <div className="h-16 bg-surface rounded mb-4"></div>
  <span className="sr-only">Loading content...</span>
</div>
```

### Empty State

```tsx
<div className="text-center py-12">
  <div className="text-6xl mb-4">📭</div>
  <h3 className="text-xl font-semibold text-text-base mb-2">No items found</h3>
  <p className="text-text-muted mb-4">Get started by adding your first item</p>
  <button className="btn btn-primary">Create New</button>
</div>
```

### Error State

```tsx
<div className="alert alert-error" role="alert">
  <p className="font-semibold">Error</p>
  <p>Something went wrong. Please try again.</p>
</div>
```

### Success Message

```tsx
<div className="alert alert-success" role="status">
  <p className="font-semibold">Success!</p>
  <p>Your changes have been saved.</p>
</div>
```

---

## 📦 Component Checklist

When creating a new component, ensure:

- [ ] Uses semantic CSS classes (`.btn`, `.card`, etc.)
- [ ] Implements dark mode support via CSS variables
- [ ] Includes proper TypeScript types
- [ ] Has accessible ARIA labels where needed
- [ ] Supports keyboard navigation
- [ ] Includes focus visible states
- [ ] Uses standardized animations from `utils/animations.ts`
- [ ] Follows responsive design patterns
- [ ] Has loading/error/empty states where applicable
- [ ] Documented with JSDoc comments

---

## 🎯 Best Practices

### DO ✅

```tsx
// Use semantic classes
<button className="btn btn-primary">Submit</button>

// Use CSS variables for colors
<div className="bg-surface text-text-base">

// Proper accessibility
<button aria-label="Close menu" onClick={closeMenu}>
  <XIcon className="w-6 h-6" aria-hidden="true" />
</button>

// Consistent spacing
<section className="mb-12">
  <h2 className="headline mb-6">Title</h2>
</section>
```

### DON'T ❌

```tsx
// Don't use hardcoded colors
<div className="bg-white text-black"> // ❌

// Don't mix naming conventions
<h2 className="headline text-on-surface"> // ❌ (use text-text-base)

// Don't forget accessibility
<div onClick={handleClick}> // ❌ (use button)

// Don't use inline styles for theme colors
<div style={{ color: '#1a1a1a' }}> // ❌
```

---

## 📚 Resources

- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Framer Motion Docs:** https://www.framer.com/motion/
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **React Accessibility:** https://reactjs.org/docs/accessibility.html

---

**Last Updated:** November 24, 2025  
**Version:** 0.2.5  
**Maintained By:** Development Team
