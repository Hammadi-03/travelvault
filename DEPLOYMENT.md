# TravelVault Production Deployment Guide

## 405 Error — Root Cause & Fix

### What Was Wrong

The production build was sending API requests to `https://travelvault.make-it161.workers.dev/api/*` (the Cloudflare Worker frontend), which only serves static assets and has no API handlers → **405 Method Not Allowed**.

### Why It Happened

- **Frontend**: `VITE_API_URL` was empty in `.env` before building
- **Result**: `api.ts` constructed same-origin URLs like `/api/register`
- **Cloudflare Worker**: no proxy, no worker script — pure static asset server
- **Outcome**: all API calls returned 405

### The Fix (Already Applied)

1. **Set `VITE_API_URL` before building:**
   ```bash
   # .env (root)
   VITE_API_URL=https://api.murjanlab.my.id
   ```

2. **Rebuild and redeploy the frontend:**
   ```bash
   npm run deploy
   ```
   ✅ **Status**: Deployed successfully — version `6038328a-e707-4452-a870-bccf7dd55a33`

3. **Configure CORS in Laravel backend:**
   ```php
   // backend/config/cors.php
   'allowed_origins' => array_filter(array_map(
       'trim',
       explode(',', env('FRONTEND_URL', 'http://localhost:3000,http://localhost:5173'))
   )),
   ```
   
   ```bash
   # backend/.env
   APP_URL=https://api.murjanlab.my.id
   FRONTEND_URL=https://murjanlab.my.id,http://localhost:5173,http://localhost:3000
   ```
   ✅ **Status**: Updated

## Deployment Checklist

### Frontend (Cloudflare Workers)

- [x] Set `VITE_API_URL=https://api.murjanlab.my.id` in `.env`
- [x] Run `npm run build`
- [x] Run `wrangler deploy`
- [x] Verify: `https://travelvault.make-it161.workers.dev` loads

### Backend (Laravel @ api.murjanlab.my.id)

- [ ] Ensure Laravel is deployed and running at `https://api.murjanlab.my.id`
- [ ] Database migrations applied: `php artisan migrate`
- [ ] Storage symlink created: `php artisan storage:link`
- [ ] `.env` matches production config:
  ```bash
  APP_URL=https://api.murjanlab.my.id
  FRONTEND_URL=https://murjanlab.my.id,http://localhost:5173,http://localhost:3000
  APP_ENV=production
  APP_DEBUG=false
  ```
- [ ] Test an API endpoint directly:
  ```bash
  curl -X POST https://api.murjanlab.my.id/api/register \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{"email":"test@example.com","password":"secret123","password_confirmation":"secret123","display_name":"Test"}'
  ```
  Expected: `200 OK` with `{ "token": "...", "user": {...} }`

## Testing the Fix

### From the Frontend

1. Visit `https://travelvault.make-it161.workers.dev`
2. Click **Sign Up**
3. Fill in the form and submit
4. ✅ **Expected**: registration succeeds (no 405)
5. ❌ **If 405 persists**: check Network tab → the request URL should be `https://api.murjanlab.my.id/api/register`, not `.workers.dev/api/register`

### From Command Line

```bash
# Test CORS preflight (OPTIONS)
curl -X OPTIONS https://api.murjanlab.my.id/api/register \
  -H "Origin: https://murjanlab.my.id" \
  -H "Access-Control-Request-Method: POST" \
  -i

# Expected response includes:
# Access-Control-Allow-Origin: https://murjanlab.my.id
# Access-Control-Allow-Methods: *
```

## TDD Implementation

We've added comprehensive unit tests using Vitest + React Testing Library:

### Test Coverage

- ✅ **`src/test/api.test.ts`** — 31 tests covering all HTTP methods (GET/POST/PUT/DELETE)
  - Token storage
  - Auth API (login, register, logout, me, forgotPassword)
  - Profile API (update, uploadAvatar)
  - Media API (list, search, delete)
  - 405-regression suite (API_BASE URL construction)

- ✅ **`src/test/utils.test.ts`** — utility function tests (formatBytes, cn, etc.)

- ✅ **`src/test/useSearch.test.ts`** — search hook behavior (pagination, filters, error handling)

- ✅ **`src/test/useMedia.test.ts`** — media hook behavior (infinite scroll, delete, authorization)

### Running Tests

```bash
# Run once
npm test

# Watch mode (auto-rerun on file changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

### Test Results (Latest Run)

```
Test Files  4 passed (4)
     Tests  77 passed (77)
  Duration  3.71s
```

## Common Issues

### Issue: Still Getting 405 After Deploy

**Cause**: Browser cached the old bundle  
**Fix**: Hard refresh (Ctrl+Shift+R) or clear cache

### Issue: CORS Error Instead of 405

**Cause**: Laravel `FRONTEND_URL` doesn't match the origin  
**Fix**: Add the exact origin to `backend/.env`:
```bash
FRONTEND_URL=https://murjanlab.my.id,https://travelvault.make-it161.workers.dev
```

### Issue: "Network Error" in Browser Console

**Cause**: Laravel backend is not running or not accessible  
**Fix**: Check Laravel logs, verify DNS points to the server, ensure port 443 is open

### Issue: Authentication Works But Media Upload Returns 405

**Cause**: `POST /api/media` route might be duplicated or missing from `routes/api.php`  
**Fix**: Verify `routes/api.php` contains:
```php
Route::post('/media', [MediaController::class, 'store']);
```

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│  Browser @ https://murjanlab.my.id                          │
│  (or https://travelvault.make-it161.workers.dev)           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ fetch("https://api.murjanlab.my.id/api/...")
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Laravel API @ https://api.murjanlab.my.id                  │
│  • CORS allows https://murjanlab.my.id                      │
│  • Sanctum Bearer token auth                                │
│  • Routes in routes/api.php                                 │
└─────────────────────────────────────────────────────────────┘
```

**Local Dev**: Vite proxy handles `/api/*` → `http://127.0.0.1:8000` (no CORS)  
**Production**: Direct calls to `https://api.murjanlab.my.id` (CORS required)

## Next Steps

1. ✅ Frontend deployed with correct `VITE_API_URL`
2. ⏳ Verify Laravel backend is accessible at `https://api.murjanlab.my.id`
3. ⏳ Test registration flow end-to-end
4. ⏳ Monitor logs for any remaining CORS or auth issues

---

**Last Updated**: 2026-07-03  
**Deployed Version**: `6038328a-e707-4452-a870-bccf7dd55a33`  
**Status**: Frontend fixed and redeployed ✅ | Backend verification pending ⏳
