# PwnJam

A collaborative CTF application with AI generated challenges, built with Cloudflare Durable Objects.

## Quick Start

1. **Setup your project:**

   ```bash
   npm run setup
   # or
   pnpm run setup
   ```

   This interactive script will configure your environment variables and create the necessary `.env` files.

2. **Install dependencies:**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start development:**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

## Configuration

The application uses environment variables for configuration. The setup script will guide you through configuring:

### Environment Variables

- `VITE_API_BASE_URL` - Base URL for API endpoints
- `VITE_WS_BASE_URL` - WebSocket base URL for real-time connections
- `VITE_APP_NAME` - Application name (used for branding)
- `VITE_GITHUB_REPO` - URL of the GitHub repository for the project
- `VITE_ENVIRONMENT` - Environment identifier (development/staging/production)
- `VITE_MAX_RECONNECT_ATTEMPTS` - Maximum WebSocket reconnection attempts
- `VITE_RECONNECT_BASE_DELAY` - Base delay between reconnections (ms)
- `VITE_MAX_RECONNECT_DELAY` - Maximum delay between reconnections (ms)

### Environment Files

- `.env` - Main environment configuration
- `.env.local` - Local development overrides (created automatically for development)
- `.env.example` - Template for production/staging environments
- `.env.local.example` - Template for local development

**Note:** Remember to add `.env` and `.env.local` to your `.gitignore` file to keep your configuration secure.

## Manual Configuration

If you prefer to configure manually without the setup script:

1. Copy `.env.example` to `.env` and update the values
2. For local development, copy `.env.local.example` to `.env.local`
3. Customize the environment variables according to your needs

## Customization

- Replace all instances of `pwnjam` in the code with your desired project name
- Update the application name in your environment configuration
- Modify the configuration in `src/config/index.ts` if you need additional settings
