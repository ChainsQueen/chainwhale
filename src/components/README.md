# Components

Reusable UI components for the application.

## Structure

- **`ui/`** - Base UI components (buttons, cards, inputs, etc.)
  - Shared, low-level components
  - Design system primitives
  - Should be framework-agnostic where possible

- **`features/`** - Feature-specific components
  - Domain-specific UI modules
  - Composed from `ui/` components
  - Contains business logic specific to features

## Guidelines

- Use **kebab-case** for component filenames (e.g., `user-profile-card.tsx`)
- Use **PascalCase** for component names (e.g., `UserProfileCard`)
- Keep components under 500 lines - split if larger
- Components should be focused on a single responsibility
