# Theme System Documentation

## Overview

This project uses a unified theme system that provides consistent styling across all components. All hardcoded colors and styles have been replaced with theme-aware CSS classes.

## Files Structure

### Core Theme Files

- `themes.css` - Main theme definitions with CSS custom properties
- `theme-system.css` - Comprehensive component styles (buttons, forms, alerts)
- `index.css` - Base styles and legacy compatibility classes

### Theme Variables

All colors are defined as CSS custom properties in `themes.css`:

- `--color-background` - Main background color
- `--color-surface` - Card/surface background
- `--color-primary` - Primary brand color
- `--color-secondary` - Secondary brand color
- `--color-accent` - Accent color
- `--color-text-base` - Main text color
- `--color-text-muted` - Muted text color
- `--color-success` - Success state color
- `--color-warning` - Warning state color
- `--color-error` - Error state color
- `--color-info` - Info state color

## Button System

### Button Classes

- `.btn` - Base button class
- `.btn-primary` - Primary button (brand colors)
- `.btn-secondary` - Secondary button
- `.btn-ghost` - Transparent button with border
- `.btn-success` - Success/positive action button
- `.btn-warning` - Warning button
- `.btn-error` - Error/destructive action button

### Button Sizes

- `.btn-sm` - Small button
- `.btn-lg` - Large button
- Default size (no additional class needed)

### Usage Example

```jsx
<button className="btn btn-primary">Save</button>
<button className="btn btn-error btn-sm">Delete</button>
```

## Form System

### Form Classes

- `.form-group` - Form field container
- `.form-label` - Form field label
- `.form-input` - Input field styling
- `.form-input-error` - Error state for inputs
- `.form-error-message` - Error message styling
- `.form-checkbox` - Checkbox styling
- `.form-radio` - Radio button styling

### Usage Example

```jsx
<div className="form-group">
  <label className="form-label">Email</label>
  <input className="form-input" type="email" />
</div>
```

## Text Colors

### Theme-Aware Text Classes

- `.text-base` - Main text color
- `.text-muted` - Muted text color
- `.text-primary` - Primary brand color
- `.text-secondary` - Secondary brand color
- `.text-success` - Success color
- `.text-warning` - Warning color
- `.text-error` - Error color
- `.text-info` - Info color

## Links

### Link Classes

- `.link` - Standard themed link
- `.link-muted` - Muted link styling

## Alerts/Notifications

### Alert Classes

- `.alert` - Base alert styling
- `.alert-info` - Info alert
- `.alert-success` - Success alert
- `.alert-warning` - Warning alert
- `.alert-error` - Error alert

## Migration Notes

### Replaced Hardcoded Styles

All instances of hardcoded colors have been replaced:

- `bg-blue-500` → `btn btn-primary`
- `text-red-500` → `text-error`
- `text-green-500` → `text-success`
- `border-blue-500` → `border-primary`

### Benefits

1. **Consistency** - All components use the same color palette
2. **Theme Support** - Easy to switch between light/dark themes
3. **Maintainability** - Colors defined in one place
4. **Accessibility** - Proper contrast ratios maintained
5. **Scalability** - Easy to add new themes or modify existing ones

## Adding New Themes

To add a new theme:

1. Define color variables in `themes.css`
2. Create a new CSS class with theme-specific values
3. Update the theme toggle component to include the new theme

Example:

```css
.theme-ocean {
  --color-background: 240 249 255;
  --color-primary: 59 130 246;
  /* ... other colors */
}
```
