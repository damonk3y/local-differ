# Component Patterns

Standard patterns for components in `src/new-ui/`.

## Basic Component Template

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const componentVariants = cva(
  'base-classes-here', // Base styles applied to all variants
  {
    variants: {
      variant: {
        default: 'default-variant-styles',
        secondary: 'secondary-variant-styles',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-sm',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ComponentNameProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  // Additional props here
}

const ComponentName = React.forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(componentVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
ComponentName.displayName = 'ComponentName';

export { ComponentName, componentVariants };
```

## Component with Children

```tsx
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('base-styles', className)} {...props}>
      {children}
    </div>
  )
);
```

## Compound Component Pattern

For components with sub-components (Card, CardHeader, CardContent):

```tsx
// Main component
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('card-base', className)} {...props} />
  )
);
Card.displayName = 'Card';

// Sub-component
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('header-base', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

// Export all
export { Card, CardHeader };
```

## Slot Pattern (Polymorphic Components)

For components that can render as different elements:

```tsx
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} {...props} />;
  }
);
```

## Project Style Guide

Based on existing `src/components/ui/` components:

**Colors:** Dark theme with slate gradients
- Background: `bg-gradient-to-b from-slate-900 to-slate-950`
- Border: `border-slate-800`
- Text: `text-slate-100`, `text-slate-400` (muted)
- Accent: `text-cyan-400`, `text-cyan-300`

**Effects:**
- Shadow: `shadow-lg shadow-slate-900/50`
- Backdrop: `backdrop-blur-sm`
- Hover: `hover:bg-zinc-800/50`

**Typography:**
- Gradient text: `text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300`

## Export Convention

In `src/new-ui/index.ts`:

```typescript
// Named exports for components
export { Button, buttonVariants } from './button';
export { Card, CardHeader, CardContent } from './card';
export { Input } from './input';

// Type exports if needed
export type { ButtonProps } from './button';
```
