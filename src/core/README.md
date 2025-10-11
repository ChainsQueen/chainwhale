# Core

Business logic and utilities (UI-agnostic).

## Structure

- **`hooks/`** - Custom React hooks
  - Reusable stateful logic
  - Data fetching hooks
  - UI state management hooks

- **`services/`** - Business logic services
  - Domain logic
  - Data transformation
  - Business rules

- **`utils/`** - Helper functions
  - Pure utility functions
  - Formatters
  - Validators

- **`types/`** - TypeScript type definitions
  - Shared interfaces
  - Domain models
  - Utility types

## Guidelines

- Code here should be **UI-agnostic**
- No direct UI component imports
- Focus on reusability across the app
- Keep functions pure where possible
- Maximum 500 lines per file
