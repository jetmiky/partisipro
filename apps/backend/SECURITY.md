# Security and Monitoring Features

This document outlines the comprehensive security and monitoring features
implemented in the Partisipro backend.

## Security Features

### 1. Authentication & Authorization

- **JWT-based authentication** with refresh tokens
- **Role-based access control (RBAC)** with three roles: `investor`, `spv`,
  `admin`
- **Web3Auth integration** for seamless user onboarding
- **Multi-signature wallet support** for SPV authentication

### 2. Request Security

- **Rate limiting** with Redis-backed storage
  - Global rate limiting: 100 requests per 15 minutes
  - Auth endpoints: 5 requests per 15 minutes
  - Admin endpoints: 10 requests per 15 minutes
- **CORS protection** with configurable origins
- **Security headers** (XSS, CSRF, Clickjacking protection)
- **Content Security Policy (CSP)** headers
- **Input validation** with class-validator

### 3. Data Protection

- **Encryption at rest** for sensitive data
- **Sensitive field detection** and automatic redaction in logs
- **Secure session management** with Redis
- **API key authentication** for internal services

### 4. Audit & Compliance

- **Comprehensive audit logging** for all requests
- **Request tracing** with unique request IDs
- **Sensitive data sanitization** in logs
- **GDPR compliance** features

## Monitoring Features

### 1. Health Checks

- **System health monitoring** for all services
- **Service dependency checks** (Firebase, Redis, Blockchain)
- **Real-time metrics** collection
- **Performance monitoring** with response time tracking

### 2. Alerting System

- **Real-time alerts** for critical issues
- **Configurable thresholds** for metrics
- **Alert severity levels** (low, medium, high, critical)
- **Automated notifications** for high-severity alerts

### 3. Metrics Collection

- **Request/response metrics** (count, duration, errors)
- **System metrics** (CPU, memory, connections)
- **Business metrics** (user registrations, investments, profits)
- **Error tracking** with automatic categorization

### 4. Caching Strategy

- **Redis-based caching** for performance optimization
- **Intelligent cache invalidation** by tags
- **Cache statistics** and monitoring
- **Fallback mechanisms** for cache failures

## Implementation Details

### Middleware Stack

The security middleware is applied in the following order:

1. **SecurityMiddleware** - Sets security headers, CORS, CSP
2. **AuditMiddleware** - Logs all requests with sanitization
3. **RateLimitMiddleware** - Implements request rate limiting
4. **AuthRateLimitMiddleware** - Stricter limits for auth endpoints

### Services

#### HealthService

- Monitors system health across all components
- Provides detailed health reports for admin users
- Tracks service response times and availability

#### CacheService

- Unified caching interface with Redis backend
- Supports TTL, pattern matching, and atomic operations
- Includes cache statistics and monitoring

#### MonitoringService

- Real-time metrics collection and analysis
- Configurable alerting with multiple severity levels
- Integration with external notification services

### Error Handling

#### GlobalExceptionFilter

- Catches all unhandled exceptions
- Provides consistent error response format
- Sanitizes sensitive data in error logs
- Integrates with monitoring for error tracking

## Configuration

### Environment Variables

```bash
# Security
ENCRYPTION_KEY=your-encryption-key-here
API_KEYS=api-key-1,api-key-2,api-key-3
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100

# Monitoring
MONITORING_ENABLED=true
ALERT_EMAIL=admin@partisipro.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=./logs/app.log
```

## API Endpoints

### Health Check

- `GET /health` - Basic health status (public)
- `GET /health/detailed` - Detailed health report (admin only)
- `GET /health/metrics` - System metrics (admin only)

### Security Headers

All responses include security headers:

- `X-XSS-Protection: 1; mode=block`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy: [detailed policy]`

### Rate Limiting Headers

Rate-limited responses include:

- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests in window
- `X-RateLimit-Reset` - Time when limit resets

## Best Practices

### Development

1. **Use environment variables** for all sensitive configuration
2. **Test rate limiting** during development
3. **Monitor logs** for security-related events
4. **Use proper error handling** to avoid information leakage

### Production

1. **Enable all security features** in production
2. **Monitor alerts** and respond quickly to critical issues
3. **Regular security audits** of logs and metrics
4. **Keep dependencies updated** for security patches

### Monitoring

1. **Set up notification channels** for critical alerts
2. **Monitor key metrics** regularly
3. **Review audit logs** for suspicious activity
4. **Test alerting system** periodically

## Troubleshooting

### Common Issues

#### Rate Limiting

- **Problem**: Users getting 429 errors
- **Solution**: Check Redis connection, adjust rate limits

#### Cache Issues

- **Problem**: Slow response times
- **Solution**: Check Redis performance, review cache hit rates

#### Authentication Failures

- **Problem**: JWT validation errors
- **Solution**: Check JWT secret, token expiration, user permissions

#### Monitoring Alerts

- **Problem**: False positive alerts
- **Solution**: Adjust thresholds, review metric collection

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Monitor rate limiting
redis-cli keys "rate_limit:*"

# Check cache statistics
redis-cli info memory

# View recent audit logs
firebase firestore:query audit_logs --limit 10
```

## Security Considerations

### Data Protection

- All sensitive data is encrypted at rest
- Logs are automatically sanitized
- API keys are rotated regularly
- Rate limiting prevents abuse

### Compliance

- GDPR compliance for user data
- Audit trails for all actions
- Data retention policies
- Right to be forgotten implementation

### Incident Response

- Automated alerts for security events
- Detailed logging for forensic analysis
- Emergency response procedures
- Regular security assessments

## Future Enhancements

### Planned Features

1. **Web Application Firewall (WAF)** integration
2. **Advanced threat detection** using AI/ML
3. **Automated security testing** in CI/CD pipeline
4. **Enhanced metrics** with custom dashboards
5. **Integration with external monitoring** services

### Performance Optimizations

1. **Caching improvements** with intelligent prefetching
2. **Database query optimization** based on monitoring data
3. **Load balancing** for high availability
4. **CDN integration** for static assets

This security and monitoring framework provides a solid foundation for a
production-ready fintech application with comprehensive protection and
observability.
