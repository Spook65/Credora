# Credora

Credora is the foundation for a restaurant website and local presence checkup. The eventual product will help restaurant owners understand whether a new customer can find essentials such as a menu, hours, phone number, location, contact options, and basic trust signals on a public website.

This repository currently contains only the project foundation. It does not scan websites yet.

## Current MVP Status

Implemented:

- React, TypeScript, Vite frontend in `client/`
- Tailwind CSS frontend styling
- Fastify, TypeScript backend in `server/`
- `GET /health` endpoint
- Environment configuration with safe defaults
- Baseline backend protections with CORS and security headers
- Honest landing shell with a disabled scan control

Deferred:

- Website scanning
- URL fetching
- SSRF defenses
- Findings engine
- Reports
- Persistence/database
- Authentication
- Payments
- AI integrations
- Monitoring
- Review scraping
- Scoring

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, TypeScript, Fastify
- Package management: npm workspaces

## Directory Structure

```text
/
  client/
    src/
      components/
      lib/
      pages/
      styles/
  server/
    src/
      config/
      lib/
      routes/
      services/
  .env.example
  package.json
  README.md
```

## Local Development

Install dependencies:

```sh
npm install
```

Create an optional local environment file:

```sh
cp .env.example .env
```

Run the backend:

```sh
npm run dev:server
```

Run the frontend in another terminal:

```sh
npm run dev:client
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend health check: `http://127.0.0.1:4000/health`

## Environment

`.env.example` contains only foundation-level variables:

- `PORT`: backend port
- `HOST`: backend bind host
- `CLIENT_ORIGIN`: allowed frontend origin for CORS

No API keys or third-party secrets are required at this stage.

## Verification

Build both workspaces:

```sh
npm run build
```

Typecheck both workspaces:

```sh
npm run typecheck
```

Check the backend health endpoint:

```sh
curl http://127.0.0.1:4000/health
```

Expected response:

```json
{ "status": "ok" }
```

## Scanner Security Note

Future URL-scanning work must implement SSRF defenses before fetching any user-supplied URL. At minimum, scanner code must validate public HTTP/HTTPS URLs, reject private/internal/link-local/localhost targets, restrict unsafe ports, enforce timeouts and response-size limits, and revalidate every redirect destination after DNS resolution.

Do not add website fetching until those protections are designed and tested.
