# Staple - Online T-Shirt Store

Staple is a production-grade e-commerce application for ordering custom t-shirts, built with Next.js, TypeScript, Tailwind CSS, and Stripe.

## Project Structure

This project uses the Next.js App Router. Below is the directory structure and the purpose of each folder:

- `/app` — Contains all application routes, pages, layouts, and route handlers. Follows the Next.js App Router conventions.
- `/app/api` — Server-side API route handlers (e.g., Stripe webhook receiver, Stripe Checkout session creation).
- `/components` — Reusable, presentation-focused UI components. These should be modular and avoid direct side effects or state management where possible.
- `/context` — React Context providers for global application state (e.g., Cart context, Theme context).
- `/lib` — Server-side utilities, database helper functions, shared third-party SDK clients (such as the Stripe client initializer), and server-only modules.
- `/public` — Static assets such as images, logos, icons, and fonts.

## Getting Started

### Prerequisites

Ensure you have Node.js 18.18+ or 20+ installed.

### Installation

1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## Tooling & Quality Scripts

- `npm run lint` — Lint code using ESLint.
- `npm run format` — Auto-format code using Prettier.
- `npm run build` — Build the application for production.
- `npm run start` — Run the built production server.
