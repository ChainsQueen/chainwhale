# Lib

External integrations and API clients.

## Structure

- **`blockscout/`** - Blockscout API client and utilities
  - API endpoints
  - Data fetching functions
  - Type definitions for Blockscout responses

- **`ai/`** - AI service integration
  - AI model clients
  - Prompt templates
  - AI-related utilities

- **`shared/`** - Shared utilities for lib modules
  - Common HTTP clients
  - Shared types
  - Helper functions

## Guidelines

- All external API calls should be defined here
- Keep business logic in `core/`, not here
- Export clean, typed interfaces
- Handle errors appropriately
