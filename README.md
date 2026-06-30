# TravelVault

A private media-sharing platform for small groups of friends travelling together.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Routing**: React Router v6
- **Animations**: Framer Motion (spring physics)

## Features

- 🔐 Auth — Login, Sign Up, Forgot Password
- 🖼️ Masonry gallery with infinite scroll and lazy loading
- 📤 Drag-and-drop multi-file upload (JPG, PNG, HEIC, MP4)
- 🔍 Search by filename and file type
- 🖥️ Fullscreen media viewer with keyboard navigation
- 🗑️ Delete your own uploads
- ⬇️ Download original quality
- 👤 Profile with avatar upload and display name editing
- 🌙 Dark/light mode
- 📱 Fully responsive (mobile, tablet, desktop)

## Project Structure

```
src/
  components/
    auth/         # AuthCard, ProtectedRoute
    layout/       # Navbar, PageLayout
    media/        # MediaCard, MediaViewer, MasonryGrid
    ui/           # Button, Input, Avatar, Modal, Skeleton, Badge, ProgressBar
  context/        # AuthContext (auth state + profile)
  hooks/          # useMedia, useUpload, useSearch, useDarkMode
  lib/            # supabase.ts, utils.ts
  pages/          # LoginPage, SignUpPage, ForgotPasswordPage,
                  # GalleryPage, UploadPage, SearchPage, ProfilePage
  types/          # index.ts (shared TypeScript types)
api/
  README.md       # PHP REST API backend
  .env.example    # backend env sample
```

## Setup

### 1. PHP API backend

1. Configure the API backend by copying `api/.env.example` to `api/.env`.
2. Set `VITE_API_URL` in the frontend root `.env` to the API URL.
3. The API folder contains the PHP REST endpoints used by the frontend.

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:8000
```

For local development, point `VITE_API_URL` to the PHP API server.

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. Build for production

```bash
npm run build
npm run preview
```

### 5. Deploy to Cloudflare Pages

1. In your Cloudflare dashboard, create a new Pages project.
2. Connect the repository and set the build command to:

```bash
npm run build
```

3. Set the build output directory to:

```bash
dist
```

4. Add an environment variable for production API URL:

```bash
VITE_API_URL=https://your-api.example.com
```

5. Cloudflare Pages automatically handles single-page app routing when `assets.not_found_handling` is set to `single-page-application` in Wrangler config.

## Security

- Row Level Security (RLS) is enabled on all tables
- Users can only delete their own media
- Storage paths are namespaced by user ID
- All media is viewable by any authenticated user (group sharing model)
