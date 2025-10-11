# ChainWhale

[![Deploy to GitHub Pages](https://github.com/ChainsQueen/chainwhale/actions/workflows/deploy.yml/badge.svg)](https://github.com/ChainsQueen/chainwhale/actions/workflows/deploy.yml)

A Next.js application for blockchain exploration and analysis.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
chainwhale/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (routes)/          # Route groups
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components (buttons, cards, etc.)
│   │   └── features/         # Feature-specific components
│   ├── lib/                  # External integrations & clients
│   │   ├── blockscout/      # Blockscout API client
│   │   ├── ai/              # AI service integration
│   │   └── shared/          # Shared utilities for lib
│   ├── core/                # Business logic (UI-agnostic)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Helper functions
│   │   └── types/           # TypeScript types
│   ├── styles/              # Global CSS and Tailwind
│   └── config/              # Configuration files
├── public/                  # Static assets
└── .github/workflows/       # GitHub Actions
```

### Folder Guidelines

- **`app/`** - Next.js routing, layouts, and pages only
- **`components/`** - Reusable UI components
  - `ui/` for base components
  - `features/` for domain-specific components
- **`lib/`** - External API clients and integrations
- **`core/`** - Business logic that's UI-agnostic
- **`styles/`** - Global styles and Tailwind configuration
- **`config/`** - App configuration files

## 🎨 Code Style

### Naming Conventions

- **Files**: Use `kebab-case` (e.g., `user-profile-card.tsx`)
- **Components**: Use `PascalCase` (e.g., `UserProfileCard`)
- **Functions/Variables**: Use `camelCase`
- **Constants**: Use `UPPER_SNAKE_CASE`

### File Size Limit

- Maximum **500 lines** per file
- Split into smaller modules if approaching this limit

### Module Organization

- Keep files focused on a single responsibility
- Business logic in `core/`, never in components
- UI components should be presentational

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4
- **React**: 19.1.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4.x
- **Package Manager**: pnpm 9.x

## 📦 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 🚢 Deployment

This project is automatically deployed to GitHub Pages via GitHub Actions.

- **Live URL**: https://chainsqueen.github.io/chainwhale/
- **Workflow**: `.github/workflows/deploy.yml`

Every push to `main` triggers a new deployment.

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📄 License

MIT
