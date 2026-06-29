# TravelVault PHP API

Simple PHP 8.1+ REST backend that replaces Supabase.  
Uses **MySQL** for data and stores files directly on disk.

---

## Requirements

- PHP 8.1+  
- MySQL 8.0+ (or MariaDB 10.6+)  
- A web server (Apache / Nginx) **or** PHP's built-in server for local dev

---

## Quick start (local development)

### 1. Create the database

```bash
mysql -u root -p < database/schema.sql
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```
DB_HOST=localhost
DB_NAME=travelvault
DB_USER=root
DB_PASS=yourpassword
JWT_SECRET=a-very-long-random-string
APP_URL=http://localhost:8000
ALLOWED_ORIGIN=http://localhost:5173
```

> **Important:** change `JWT_SECRET` to a long random string before going to production.

### 3. Create the uploads directory

```bash
mkdir uploads
chmod 755 uploads          # Linux/macOS
```

On Windows the `uploads/` folder is already created (it contains `.gitkeep`).

### 4. Start the PHP dev server

Run this from the project root (not inside `api/`):

```bash
php -S localhost:8000
```

This serves both the API (`/api/…`) and uploaded files (`/uploads/…`) from the same origin.

### 5. Start the Vite dev server

```bash
npm install
npm run dev
```

---

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register.php` | — | Create account |
| POST | `/api/auth/login.php` | — | Sign in, returns JWT |
| GET | `/api/auth/me.php` | ✓ | Get current user |
| POST | `/api/auth/forgot-password.php` | — | Request password reset |
| PUT | `/api/profile/update.php` | ✓ | Update display_name / avatar_url |
| POST | `/api/profile/avatar.php` | ✓ | Upload avatar image |
| GET | `/api/media/list.php?page=0` | ✓ | Paginated media list |
| GET | `/api/media/search.php?q=&file_type=all&page=0` | ✓ | Search media |
| POST | `/api/media/upload.php` | ✓ | Upload a media file |
| DELETE | `/api/media/delete.php?id=<uuid>` | ✓ | Delete own media |

All protected endpoints require `Authorization: Bearer <token>` header.

---

## Production notes

- Set `upload_max_filesize` and `post_max_size` to at least **500M** in `php.ini`.
- Ensure the `uploads/` directory is writable by the web server user.
- Point Nginx/Apache document root to the project root so `/uploads/` is served as static files.
- Use HTTPS and a proper reverse proxy in production.
