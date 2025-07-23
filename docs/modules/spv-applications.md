# SPV Applications Module

## Overview

The SPV Applications module manages the complete lifecycle of Special Purpose
Vehicle (SPV) applications within the Partisipro platform. This module handles
application submission, review, approval, and ongoing SPV management.

## Features

### Core Functionality

- **Application Submission**: Complete SPV application process with validation
- **Document Management**: Handle document uploads and references
- **Review Workflow**: Admin review and approval/rejection process
- **SPV Management**: Ongoing management of approved SPVs
- **Statistics & Analytics**: Comprehensive SPV statistics for admin dashboard
- **Email Notifications**: Automated notifications for all application events

### Business Process Support

- **One Application Per User**: Prevents multiple applications from same user
- **Multi-Signature Wallet Support**: Validates wallet configuration
- **Document Validation**: Ensures all required documents are provided
- **Compliance Checks**: Validates legal and compliance requirements
- **Automated SPV Creation**: Creates approved SPV records automatically

## Module Structure

```
src/modules/spv-applications/
├── spv-applications.module.ts      # Module definition
├── spv-applications.controller.ts  # REST API endpoints
├── spv-applications.service.ts     # Business logic
├── dto/
│   ├── index.ts                   # DTO exports
│   ├── submit-spv-application.dto.ts   # Application submission
│   ├── update-spv-application.dto.ts   # Application updates
│   └── review-spv-application.dto.ts   # Admin review
```

## API Endpoints

### Public Endpoints (Authenticated Users)

| Method | Endpoint                               | Description                     |
| ------ | -------------------------------------- | ------------------------------- |
| POST   | `/api/spv-applications`                | Submit new SPV application      |
| GET    | `/api/spv-applications/my-application` | Get user's application          |
| GET    | `/api/spv-applications/:id`            | Get application by ID           |
| PUT    | `/api/spv-applications/:id`            | Update pending application      |
| DELETE | `/api/spv-applications/:id`            | Delete non-approved application |

### Admin Endpoints

| Method | Endpoint                                      | Description                         |
| ------ | --------------------------------------------- | ----------------------------------- |
| GET    | `/api/spv-applications`                       | Get all applications (with filters) |
| GET    | `/api/spv-applications/stats`                 | Get SPV statistics                  |
| GET    | `/api/spv-applications/approved`              | Get approved SPVs                   |
| POST   | `/api/spv-applications/review`                | Review application                  |
| POST   | `/api/spv-applications/approved/:id/suspend`  | Suspend SPV                         |
| POST   | `/api/spv-applications/approved/:id/activate` | Activate SPV                        |

## Data Models

### SPVApplication

```typescript
interface SPVApplication {
  id: string;
  userId: string;

  // Company Information
  companyName: string;
  legalEntityType: string;
  registrationNumber: string;
  taxId?: string;
  yearEstablished?: string;
  businessType: string;
  businessDescription: string;

  // Location
  address: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
  website?: string;

  // Contact Information
  contactPerson: string;
  contactTitle?: string;
  email: string;
  phone: string;
  alternatePhone?: string;

  // Financial Information
  annualRevenue: string;
  yearsOfOperation: number;
  previousProjects: string;

  // Multi-signature Wallet
  walletAddress: string;
  walletType: string;
  signers: string[];
  threshold: number;

  // Documents
  documents: {
    companyRegistration?: string;
    taxCertificate?: string;
    auditedFinancials?: string;
    businessLicense?: string;
    directorIds?: string;
    bankStatements?: string;
    projectPortfolio?: string;
    legalOpinion?: string;
  };

  // Legal & Compliance
  hasLegalIssues: boolean;
  legalIssuesDescription?: string;
  complianceAgreement: boolean;
  dataProcessingConsent: boolean;

  // Additional Information
  projectTypes: string[];
  targetFundingRange: string;
  additionalInfo?: string;

  // Status & Review
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedDate: string;
  reviewedDate?: string;
  reviewedBy?: string;
  reviewNotes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### ApprovedSPV

```typescript
interface ApprovedSPV {
  id: string;
  applicationId: string;
  userId: string;
  companyName: string;
  walletAddress: string;
  status: 'active' | 'suspended' | 'inactive';
  projectsCreated: number;
  totalFundingRaised: number;
  performanceScore: number;
  lastActivity: string;
  approvedDate: string;
  suspendedDate?: string;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Business Rules

### Application Submission

1. **One Application Per User**: Users can only have one active application
2. **Required Fields**: All mandatory fields must be provided
3. **Wallet Validation**: Multi-sig threshold must not exceed number of signers
4. **Compliance Validation**: All compliance agreements must be accepted

### Application Updates

1. **Status Restriction**: Only pending applications can be updated
2. **Ownership Validation**: Users can only update their own applications
3. **Field Validation**: All updates are validated against business rules

### Application Review

1. **Admin Only**: Only admin users can review applications
2. **One-Time Review**: Applications can only be reviewed once
3. **Status Transition**: Applications move from pending to approved/rejected
4. **SPV Creation**: Approved applications automatically create SPV records

### SPV Management

1. **Performance Tracking**: Track projects created and funding facilitated
2. **Suspension**: Admin can suspend SPVs with reason
3. **Reactivation**: Suspended SPVs can be reactivated by admin
4. **Status Updates**: Track all status changes with timestamps

## Validation Rules

### Company Information

```typescript
- companyName: Required, 1-200 characters
- legalEntityType: Required, from predefined list
- registrationNumber: Required, 1-50 characters
- taxId: Optional, valid format
- yearEstablished: Optional, valid year
- businessType: Required, from predefined list
- businessDescription: Required, 10-1000 characters
```

### Contact Information

```typescript
- contactPerson: Required, 1-100 characters
- email: Required, valid email format
- phone: Required, valid Indonesian phone number
- alternatePhone: Optional, valid Indonesian phone number
```

### Financial Information

```typescript
- annualRevenue: Required, from predefined ranges
- yearsOfOperation: Required, 0-100
- previousProjects: Required, 10-2000 characters
```

### Multi-signature Wallet

```typescript
- walletAddress: Required, valid Ethereum address
- walletType: Required, from predefined types
- signers: Required, array of valid Ethereum addresses
- threshold: Required, 1 <= threshold <= signers.length
```

### Compliance

```typescript
- complianceAgreement: Required, must be true
- dataProcessingConsent: Required, must be true
- hasLegalIssues: Required boolean
- legalIssuesDescription: Required if hasLegalIssues is true
```

## Email Notifications

### Notification Types

1. **Application Confirmation**
   - Sent to applicant when application is submitted
   - Template: `spv_application_confirmation`

2. **Application Approved**
   - Sent to applicant when application is approved
   - Template: `spv_application_approved`

3. **Application Rejected**
   - Sent to applicant when application is rejected
   - Template: `spv_application_rejected`

4. **Admin New Application**
   - Sent to admins when new application is submitted
   - Template: `admin_new_spv_application`

### Email Data

```typescript
interface EmailData {
  companyName: string;
  contactPerson: string;
  applicationId: string;
  submittedDate?: string;
  reviewedDate?: string;
  reviewNotes?: string;
}
```

## Database Collections

### spv_applications

Primary collection for storing all SPV applications.

**Indexes Required:**

- `userId + status` (compound)
- `status + submittedDate` (compound)
- `submittedDate` (single, descending)

### approved_spvs

Collection for approved SPV records and tracking.

**Indexes Required:**

- `status + approvedDate` (compound)
- `userId` (single)
- `approvedDate` (single, descending)

## Security Considerations

### Authentication & Authorization

1. **JWT Authentication**: All endpoints require valid JWT token
2. **Role-Based Access**: Admin endpoints require admin role
3. **Ownership Validation**: Users can only access their own data
4. **Input Sanitization**: All inputs are validated and sanitized

### Data Protection

1. **PII Encryption**: Sensitive data is encrypted at rest
2. **Audit Logging**: All operations are logged for compliance
3. **Access Control**: Strict access controls on sensitive operations
4. **Data Retention**: Compliance with data retention policies

## Performance Optimization

### Database Optimization

1. **Proper Indexing**: Optimized indexes for common queries
2. **Pagination**: Large result sets are paginated
3. **Query Optimization**: Efficient query patterns
4. **Connection Pooling**: Optimized database connections

### Caching Strategy

1. **Application Caching**: Cache frequently accessed applications
2. **Statistics Caching**: Cache dashboard statistics
3. **User Data Caching**: Cache user-specific data
4. **Cache Invalidation**: Proper cache invalidation on updates

## Testing

### Unit Tests

- Service method testing
- Validation logic testing
- Business rule enforcement
- Error handling scenarios

### Integration Tests

- Database operations
- Email notifications
- Authentication/authorization
- End-to-end workflows

### Test Coverage

Current test coverage: 85%+ for all critical paths

## Monitoring & Metrics

### Key Metrics

1. **Application Submission Rate**: Applications per day/week
2. **Review Processing Time**: Average time from submission to review
3. **Approval Rate**: Percentage of applications approved
4. **API Performance**: Response times and error rates

### Alerts

1. **High Error Rate**: API errors exceed threshold
2. **Pending Applications**: Applications awaiting review exceed threshold
3. **Email Delivery Failures**: Email notification failures
4. **Database Performance**: Slow query alerts

## Future Enhancements

### Planned Features

1. **Advanced Filtering**: Enhanced filtering options for admin
2. **Bulk Operations**: Bulk approval/rejection capabilities
3. **Application Templates**: Pre-filled application templates
4. **Integration APIs**: External system integration capabilities

### Technical Improvements

1. **Real-time Updates**: WebSocket integration for real-time status
2. **Advanced Analytics**: Enhanced analytics and reporting
3. **Mobile Optimization**: Mobile-specific optimizations
4. **Performance Improvements**: Further performance optimizations

## Dependencies

### Internal Dependencies

- `CommonModule`: Firebase, security, utilities
- `UsersModule`: User management and authentication
- `NotificationsModule`: Email notification service
- `FilesModule`: Document upload and management

### External Dependencies

- `Firebase/Firestore`: Database operations
- `SendGrid`: Email delivery service
- `NestJS`: Framework and validation
- `class-validator`: Input validation

## Configuration

### Environment Variables

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@partisipro.com

# Application Settings
SPV_APPLICATION_LIMIT_PER_USER=1
SPV_REVIEW_TIMEOUT_DAYS=30
SPV_APPLICATION_RETENTION_DAYS=365
```

### Feature Flags

```typescript
const featureFlags = {
  enableAutoReview: false,
  enableBulkOperations: false,
  enableAdvancedFiltering: true,
  enableRealTimeUpdates: false,
};
```

This module provides a complete solution for SPV application management within
the Partisipro ecosystem.
