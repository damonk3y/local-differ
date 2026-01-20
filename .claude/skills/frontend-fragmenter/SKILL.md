---
name: frontend-fragmenter
description: |
  Manages a reusable UI component library at src/new-ui. Automatically triggers when:
  (1) Any frontend/UI change is requested (new features, modifications, fixes)
  (2) Building new screens, pages, or views
  (3) Creating modals, forms, cards, lists, or any visual element
  (4) Refactoring or improving existing UI components

  This skill ensures component reuse, consistency, and prevents breaking changes to the shared library.
---

# Frontend Fragmenter

Build and maintain the reusable UI component library at `src/new-ui/`.

## Workflow

### 1. Check Existing Components First

Before creating or modifying any UI element:

1. Read `src/new-ui/index.ts` to see all available components
2. Search for similar components: `Glob src/new-ui/**/*.tsx`
3. If a matching component exists, USE IT - do not duplicate

### 2. Evaluate Reusability

When building new UI, ask: "Will this be used more than once?"

**High reuse indicators** (build in `src/new-ui/`):
- Buttons, inputs, form fields, modals, cards
- List items, table rows, badges, tags
- Navigation elements, headers, footers
- Loading states, empty states, error states
- Any component requested for a screen that likely appears elsewhere

**Low reuse indicators** (keep in feature folder):
- Highly specific business logic views
- One-off layouts unique to a single screen
- Components with heavy feature-specific state

### 3. Creating New Components

When creating a new reusable component:

```
src/new-ui/
├── index.ts              # Re-exports all components
├── button.tsx            # Example: Button component
├── card.tsx              # Example: Card component
└── [component-name].tsx  # New component
```

**Component requirements:**
- Use React.forwardRef for ref forwarding
- Use `cva` from class-variance-authority for variants
- Use `cn` from `@/lib/utils` for class merging
- Export both component and variant types
- Follow existing patterns in `src/components/ui/`

**After creating, update `src/new-ui/index.ts`:**
```typescript
export { ComponentName } from './component-name';
```

### 4. Breaking Change Protection

**CRITICAL: Before modifying any component in `src/new-ui/`:**

1. Search for all usages: `Grep "ComponentName" --type tsx`
2. Assess impact on existing consumers
3. If changes affect existing usage:
   - **STOP and ask user for approval**
   - Explain what will break and why
   - Propose alternatives (new variant, new prop, new component)

**Safe changes (no approval needed):**
- Adding new optional props
- Adding new variants
- Internal refactoring that preserves API
- Bug fixes that don't change behavior

**Breaking changes (MUST ask first):**
- Removing or renaming props
- Changing default behavior
- Removing variants
- Changing required props
- Modifying existing variant styles significantly

### 5. Component Patterns

Follow the established patterns. See [references/patterns.md](references/patterns.md) for:
- Standard component structure
- Variant definitions
- Prop interfaces
- Export conventions

## Quick Reference

| Action | Command |
|--------|---------|
| List all components | `Read src/new-ui/index.ts` |
| Find component usage | `Grep "ComponentName" --type tsx` |
| Check component code | `Read src/new-ui/[name].tsx` |

## Decision Tree

```
Frontend change requested?
├─ Check src/new-ui/index.ts
│  ├─ Component exists → USE IT
│  └─ No match → Continue
├─ Is it reusable?
│  ├─ Yes → Create in src/new-ui/
│  └─ No → Create in feature folder
└─ Modifying existing src/new-ui/ component?
   ├─ Safe change → Proceed
   └─ Breaking change → ASK USER FIRST
```
