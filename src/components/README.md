# Components

Reusable UI components for the application.

## Structure

- **`ui/`** - Base UI components (buttons, cards, inputs, etc.)
  - Shared, low-level components from shadcn/ui
  - Design system primitives
  - Should be framework-agnostic where possible

- **`dashboard/`** - Dashboard-specific components
  - Chat interface, whale feed, wallet analysis
  - API settings and configuration
  - Composed from `ui/` components

- **Root components** - Shared across multiple pages
  - `app-header.tsx` - Unified navigation header
  - `whale-tracker-card.tsx` - Whale transfer display
  - `whale-stats.tsx` - Statistics dashboard
  - `theme-provider.tsx` & `theme-toggle.tsx` - Theme management

## Guidelines

- Use **kebab-case** for component filenames (e.g., `user-profile-card.tsx`)
- Use **PascalCase** for component names (e.g., `UserProfileCard`)
- Keep components under 500 lines - split if larger
- Components should be focused on a single responsibility
