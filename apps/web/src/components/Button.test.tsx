/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders the button with the correct label', () => {
    render(<Button label="Click Me" />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('applies primary styles when isPrimary is true', () => {
    render(<Button label="Primary Button" isPrimary />);
    const button = screen.getByText('Primary Button');
    expect(button).toHaveClass('bg-primary-default');
    expect(button).toHaveClass('text-white');
  });

  it('applies default styles when isPrimary is false or not provided', () => {
    render(<Button label="Default Button" />);
    const button = screen.getByText('Default Button');
    expect(button).toHaveClass('bg-background-dark');
    expect(button).toHaveClass('text-text-dark');
  });
});
