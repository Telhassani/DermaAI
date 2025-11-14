/**
 * Button Component Tests
 * Example test suite for Button component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '@/components/ui/modern/Button'
import { Plus } from 'lucide-react'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with text content', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('renders as a button element by default', () => {
      render(<Button>Test</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      render(<Button className="custom-class">Test</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    it('renders primary variant with correct classes', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gradient-to-r')
    })

    it('renders ghost variant with correct classes', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-mono-100')
    })

    it('renders outline variant with correct classes', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border')
    })

    it('renders danger variant with correct classes', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gradient-to-r')
      expect(button.className).toContain('danger')
    })
  })

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9')
    })

    it('renders medium size correctly (default)', () => {
      render(<Button>Medium</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11')
    })

    it('renders large size correctly', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-14')
    })
  })

  describe('Icons', () => {
    it('renders with left icon', () => {
      render(
        <Button leftIcon={<Plus data-testid="left-icon" />}>
          With Icon
        </Button>
      )
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByText('With Icon')).toBeInTheDocument()
    })

    it('renders with right icon', () => {
      render(
        <Button rightIcon={<Plus data-testid="right-icon" />}>
          With Icon
        </Button>
      )
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('renders icon only button', () => {
      render(
        <Button size="icon">
          <Plus data-testid="only-icon" />
        </Button>
      )
      expect(screen.getByTestId('only-icon')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('calls onClick handler when clicked', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('calls onClick with event object', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledWith(expect.any(Object))
    })

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('States', () => {
    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('is disabled when loading', () => {
      render(<Button loading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('hides text content when loading', () => {
      const { rerender } = render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeVisible()

      rerender(<Button loading>Click me</Button>)
      const text = screen.getByText('Click me')
      expect(text).toHaveClass('opacity-0')
    })
  })

  describe('Accessibility', () => {
    it('has type="button" by default', () => {
      render(<Button>Test</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('can be a submit button', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('is keyboard accessible', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Test</Button>)

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()

      // Simulate Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
    })
  })

  describe('Full Width', () => {
    it('renders full width when specified', () => {
      render(<Button fullWidth>Full Width</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })
  })
})
