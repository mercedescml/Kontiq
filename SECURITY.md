# Security Implementation Guide

## 🔐 Security Features Implemented

### 1. JWT Authentication
- All API endpoints (except `/api/users/register` and `/api/users/login`) now require JWT authentication
- Tokens expire after 24 hours
- Tokens must be included in Authorization header: `Bearer <token>`

### 2. Rate Limiting
- **Login endpoint**: 5 attempts per 15 minutes per IP
- **All API endpoints**: 100 requests per minute per IP
- Protects against brute-force and DoS attacks

### 3. IDOR Protection
- All PUT/DELETE operations verify resource ownership before modification
- Users can only modify/delete resources they own (via `userId` field)
- Prevents unauthorized access to other users' data

### 4. User Enumeration Prevention
- Login endpoint returns generic error message "Ungültige Anmeldedaten"
- Same error for non-existent users and wrong passwords
- Prevents attackers from discovering valid email addresses

### 5. Secure Authentication Flow
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens signed with secret key from environment variable
- User identity extracted from validated JWT token, not request body

## 🚀 Usage

### Client-Side Authentication

#### 1. Login
```javascript
const response = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { user, token } = await response.json();
// Store token securely (localStorage or sessionStorage)
localStorage.setItem('token', token);
```

#### 2. Making Authenticated Requests
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/zahlungen?userId=user@example.com', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### 3. Handling 401/403 Errors
```javascript
if (response.status === 401 || response.status === 403) {
  // Token expired or invalid - redirect to login
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
JWT_SECRET=your_secure_secret_key_at_least_32_characters_long
```

**⚠️ IMPORTANT**: Change `JWT_SECRET` in production! Use a cryptographically secure random string.

### Generate Secure JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🔒 Security Checklist

- [x] JWT authentication on all protected endpoints
- [x] Rate limiting on login (5 attempts / 15 min)
- [x] Rate limiting on API (100 req / min)
- [x] IDOR protection with ownership verification
- [x] User enumeration prevention
- [x] Passwords hashed with bcrypt
- [x] Secure JWT secret from environment
- [ ] HTTPS in production (configure reverse proxy)
- [ ] CSRF tokens (future enhancement)
- [ ] Input sanitization (Joi validation in place)

## 📊 API Changes

### Breaking Changes
All API endpoints now require authentication. Update your frontend code to:
1. Store JWT token after login
2. Include token in Authorization header for all API requests
3. Handle 401/403 errors by redirecting to login

### Registration Endpoint
`POST /api/users/register` - Still public (no auth required)

### Login Endpoint
`POST /api/users/login` - Returns JWT token:
```json
{
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Inc"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Protected Endpoints
All other `/api/*` endpoints now require:
```
Authorization: Bearer <token>
```

## 🛡️ Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use HTTPS in production** - Configure Nginx/Apache reverse proxy
3. **Rotate JWT secret regularly** - Update `JWT_SECRET` periodically
4. **Monitor rate limit violations** - Check logs for suspicious activity
5. **Keep dependencies updated** - Run `npm audit` regularly

## 📝 Migration Guide

### Frontend Updates Required

1. **Update login.html**:
   - Store JWT token after successful login
   - Include token in localStorage

2. **Update app.js**:
   - Add Authorization header to all API calls
   - Handle 401/403 responses

3. **Example fetch wrapper**:
```javascript
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
    throw new Error('Authentication required');
  }

  return response;
}
```

## 🔍 Testing

### Test Rate Limiting
```bash
# Should block after 5 attempts
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/users/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test JWT Authentication
```bash
# Without token - should return 401
curl http://localhost:3000/api/zahlungen

# With valid token - should return data
curl http://localhost:3000/api/zahlungen \
  -H "Authorization: Bearer <your_token>"
```

### Test IDOR Protection
```bash
# Try to modify another user's resource - should return 403
curl -X PUT http://localhost:3000/api/zahlungen/123 \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 999}'
```

## 📞 Support

For security concerns or vulnerabilities, please contact the development team immediately.
