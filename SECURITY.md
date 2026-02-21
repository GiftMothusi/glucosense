# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in GlucoSense, please report it by emailing the maintainers directly. **Do not** create a public GitHub issue for security vulnerabilities.

## Security Best Practices

### Environment Variables

All sensitive credentials and configuration values are stored in `.env` files:

- **Backend**: `/backend/.env` - API keys, database URLs, secrets
- **Infrastructure**: `/infra/.env` - Database credentials, service passwords

**Never commit `.env` files to version control.**

### Database Credentials

The PostgreSQL database credentials are configured via environment variables in `/infra/.env`:

```bash
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=glucosense
```

### API Keys and Secrets

All API keys, JWT secrets, and third-party service credentials should be stored in `/backend/.env`:

```bash
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
SENTRY_DSN=your-sentry-dsn
```

### Production Deployment

For production environments:

1. **Use strong passwords**: Minimum 16 characters with mixed case, numbers, and symbols
2. **Rotate credentials regularly**: Change passwords and API keys periodically
3. **Use secrets management**: Consider using AWS Secrets Manager, HashiCorp Vault, or similar
4. **Enable SSL/TLS**: Always use HTTPS in production
5. **Restrict database access**: Use firewall rules and VPC configurations
6. **Monitor for secrets**: Use tools like GitGuardian to scan for exposed credentials

### What NOT to Do

❌ **Never** hardcode credentials in source code  
❌ **Never** commit `.env` files to Git  
❌ **Never** share credentials in chat, email, or documentation  
❌ **Never** use default or weak passwords in production  
❌ **Never** expose database ports publicly without authentication

### GitGuardian Integration

This repository uses GitGuardian to automatically scan for exposed secrets. If you receive an alert:

1. **Immediately rotate the exposed credentials**
2. **Remove the credentials from the Git history** (if committed)
3. **Update all services** using the old credentials
4. **Review access logs** for unauthorized access

### Incident Response

If credentials are exposed:

1. **Rotate immediately**: Change all affected passwords and API keys
2. **Audit access**: Check logs for unauthorized access
3. **Notify team**: Inform relevant team members
4. **Document**: Record the incident and remediation steps
5. **Review**: Update security practices to prevent recurrence

## Secure Development Checklist

- [ ] All credentials in `.env` files
- [ ] `.env` files in `.gitignore`
- [ ] `.env.example` files with placeholder values
- [ ] Strong, unique passwords for all services
- [ ] No hardcoded secrets in code
- [ ] GitGuardian monitoring enabled
- [ ] Regular security audits scheduled
- [ ] Team trained on security best practices

## Contact

For security concerns, contact: [your-security-email@example.com]

Last updated: February 21, 2026
