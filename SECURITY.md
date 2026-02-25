# Security Best Practices

This document outlines the security measures implemented in the Telegram NFT Case Opener application and provides guidelines for maintaining security.

## Security Features Implemented

### 1. Input Validation
- **API Endpoints**: All API endpoints validate input parameters
- **Type Checking**: TypeScript provides compile-time type safety
- **Request Validation**: Missing or invalid parameters return 400 Bad Request errors
- **Parameterized Queries**: All database queries use parameterized statements to prevent SQL injection

### 2. HTTPS Enforcement
- **Production Redirect**: Automatic HTTP to HTTPS redirect in production environment
- **HSTS Header**: Strict-Transport-Security header enforces HTTPS for 1 year
- **Secure Cookies**: Session tokens should only be transmitted over HTTPS

### 3. Security Headers
The following security headers are automatically added to all responses:

- **Strict-Transport-Security**: `max-age=31536000; includeSubDomains`
  - Forces HTTPS connections for 1 year
  
- **Content-Security-Policy**: Restricts resource loading
  - Prevents XSS attacks by controlling script sources
  - Blocks inline scripts except from trusted sources
  
- **X-Frame-Options**: `DENY`
  - Prevents clickjacking attacks
  
- **X-Content-Type-Options**: `nosniff`
  - Prevents MIME type sniffing
  
- **X-XSS-Protection**: `1; mode=block`
  - Enables browser XSS protection (legacy browsers)

### 4. Rate Limiting
Rate limiting is implemented to prevent abuse:

- **Authentication Endpoint** (`/api/auth`): 5 requests per minute
- **Case Opening** (`/api/cases`): 10 requests per minute
- **Admin Endpoints** (`/api/admin`): 20 requests per minute

Rate limit headers are included in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Time when the rate limit resets

### 5. XSS Prevention
- **React Auto-Escaping**: React automatically escapes all rendered content
- **No dangerouslySetInnerHTML**: Avoid using `dangerouslySetInnerHTML` unless absolutely necessary
- **Content Security Policy**: CSP headers restrict script execution

### 6. Authentication & Authorization
- **JWT Tokens**: Secure session management using JSON Web Tokens
- **Token Expiration**: Tokens expire after a set period
- **Admin Verification**: Admin endpoints require admin role verification
- **Telegram Authentication**: Secure Telegram Web App authentication

### 7. Sensitive Data Protection
- **Environment Variables**: All secrets stored in environment variables
  - `BOT_TOKEN`: Telegram bot token
  - `JWT_SECRET`: JWT signing secret
  - `SUPABASE_KEY`: Database credentials (if using Supabase)
  
- **No Logging of Secrets**: Logger explicitly avoids logging sensitive data
- **Secure Storage**: Passwords and tokens never stored in plain text

## Security Checklist

### Development
- [ ] Never commit `.env` files to version control
- [ ] Use `.env.example` for documenting required environment variables
- [ ] Validate all user input before processing
- [ ] Use parameterized queries for all database operations
- [ ] Avoid logging sensitive information (tokens, passwords, keys)
- [ ] Keep dependencies up to date (`npm audit` regularly)

### Deployment
- [ ] Set `NODE_ENV=production` in production environment
- [ ] Use strong, randomly generated secrets for `JWT_SECRET`
- [ ] Enable HTTPS on your hosting platform
- [ ] Configure CORS to only allow your frontend domain
- [ ] Set up database backups
- [ ] Monitor error logs for suspicious activity
- [ ] Implement database connection pooling limits

### Code Review
- [ ] Check for SQL injection vulnerabilities
- [ ] Verify input validation on all endpoints
- [ ] Ensure authentication is required for protected routes
- [ ] Review admin authorization checks
- [ ] Confirm no sensitive data in error messages
- [ ] Validate file upload restrictions (if applicable)

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Contact the development team directly
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be fixed before public disclosure

## Additional Recommendations

### For Production Deployment

1. **Database Security**
   - Use connection string with SSL enabled
   - Limit database user permissions to minimum required
   - Enable database audit logging
   - Regular backups with encryption

2. **Monitoring**
   - Set up error monitoring (e.g., Sentry)
   - Monitor rate limit violations
   - Track failed authentication attempts
   - Alert on unusual activity patterns

3. **Infrastructure**
   - Use a Web Application Firewall (WAF)
   - Enable DDoS protection
   - Implement IP whitelisting for admin endpoints (optional)
   - Use separate environments (dev, staging, production)

4. **Regular Maintenance**
   - Update dependencies monthly
   - Review and rotate secrets quarterly
   - Conduct security audits periodically
   - Test backup restoration procedures

## Compliance Notes

- **GDPR**: If handling EU user data, ensure compliance with data protection regulations
- **Data Retention**: Implement data retention policies
- **User Privacy**: Provide clear privacy policy and terms of service
- **Right to Deletion**: Implement user data deletion functionality

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Telegram Bot Security](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)

---

**Last Updated**: 2024
**Version**: 1.0
