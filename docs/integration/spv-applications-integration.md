# SPV Applications Integration Guide

## Overview

This guide covers the complete integration of the SPV Applications system with
the Partisipro frontend and admin interfaces. The system provides a seamless
workflow from SPV application submission to admin review and approval.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   SPV Form      │───▶│   SPV Module    │───▶│   Firebase      │
│   /spv/apply    │    │   Controllers   │    │   Collections   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │   Notifications │    │   Email Service │
│   /admin/spv    │◀───│   Service       │───▶│   SendGrid      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Integration

### SPV Application Form (`/spv/apply`)

The frontend form at `/apps/frontend/src/app/spv/apply/page.tsx` is a
comprehensive 6-step wizard that collects all required SPV information.

#### Integration Steps

1. **Form Submission Handler**

```typescript
// In /apps/frontend/src/app/spv/apply/page.tsx
const handleSubmit = async (formData: SPVApplicationData) => {
  try {
    const response = await fetch('/api/spv-applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const result = await response.json();
      // Show success message and redirect
      router.push('/spv/dashboard?applicationSubmitted=true');
    } else {
      // Handle errors
      const error = await response.json();
      setError(error.message);
    }
  } catch (error) {
    console.error('Submission error:', error);
    setError('Failed to submit application');
  }
};
```

2. **Form Data Mapping**

The frontend form fields map directly to the API request structure:

```typescript
interface SPVFormData {
  // Step 1: Company Information
  companyName: string;
  legalEntityType: string;
  registrationNumber: string;
  taxId: string;
  yearEstablished: string;
  businessType: string;
  businessDescription: string;

  // Step 2: Location Information
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  website: string;

  // Step 3: Contact Information
  contactPerson: string;
  contactTitle: string;
  email: string;
  phone: string;
  alternatePhone: string;

  // Step 4: Financial Information
  annualRevenue: string;
  yearsOfOperation: number;
  previousProjects: string;

  // Step 5: Multi-signature Wallet
  walletAddress: string;
  walletType: string;
  signers: string[];
  threshold: number;

  // Step 6: Documents and Compliance
  documents: DocumentsData;
  hasLegalIssues: boolean;
  legalIssuesDescription: string;
  complianceAgreement: boolean;
  dataProcessingConsent: boolean;
  projectTypes: string[];
  targetFundingRange: string;
  additionalInfo: string;
}
```

3. **Document Upload Integration**

Documents are uploaded separately and file IDs are included in the application:

```typescript
const handleDocumentUpload = async (file: File, documentType: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', documentType);

  const response = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = await response.json();
  return result.data.fileId;
};
```

### Admin Panel Integration (`/admin/spv`)

The admin panel displays real SPV applications and provides review
functionality.

#### Current Implementation Update

Replace the mock data service calls with real API calls:

```typescript
// In /apps/frontend/src/app/admin/spv/page.tsx

// Replace this:
const spvData = await adminService.getSPVs();

// With this:
const spvData = await fetch('/api/spv-applications', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
}).then(res => res.json());
```

#### Admin Dashboard Statistics

Update the admin dashboard to show real SPV statistics:

```typescript
// In admin dashboard component
const [spvStats, setSpvStats] = useState(null);

useEffect(() => {
  const fetchStats = async () => {
    const response = await fetch('/api/spv-applications/stats', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const stats = await response.json();
    setSpvStats(stats.data);
  };

  fetchStats();
}, []);
```

#### Application Review Interface

Add review functionality to the admin interface:

```typescript
const handleReviewApplication = async (
  applicationId: string,
  action: 'approve' | 'reject',
  notes?: string
) => {
  const response = await fetch('/api/spv-applications/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      applicationId,
      action,
      reviewNotes: notes,
    }),
  });

  if (response.ok) {
    // Refresh the applications list
    fetchApplications();
    showNotification(`Application ${action}d successfully`);
  }
};
```

## Backend Module Registration

The SPV Applications module needs to be registered in the main app module:

```typescript
// In /apps/backend/src/app.module.ts
import { SpvApplicationsModule } from './modules/spv-applications/spv-applications.module';

@Module({
  imports: [
    // ... other modules
    SpvApplicationsModule,
  ],
  // ... rest of module configuration
})
export class AppModule {}
```

## Database Schema

### Firebase Collections

#### spv_applications Collection

```typescript
{
  id: string,                    // Auto-generated
  userId: string,                // Firebase Auth UID
  companyName: string,
  legalEntityType: string,
  registrationNumber: string,
  taxId: string,
  yearEstablished: string,
  businessType: string,
  businessDescription: string,
  address: string,
  city: string,
  province: string,
  postalCode: string,
  country: string,
  website: string,
  contactPerson: string,
  contactTitle: string,
  email: string,
  phone: string,
  alternatePhone: string,
  annualRevenue: string,
  yearsOfOperation: number,
  previousProjects: string,
  walletAddress: string,
  walletType: string,
  signers: string[],
  threshold: number,
  documents: {
    companyRegistration: string,
    taxCertificate: string,
    auditedFinancials: string,
    businessLicense: string,
    directorIds: string,
    bankStatements: string,
    projectPortfolio: string,
    legalOpinion: string
  },
  hasLegalIssues: boolean,
  legalIssuesDescription: string,
  complianceAgreement: boolean,
  dataProcessingConsent: boolean,
  projectTypes: string[],
  targetFundingRange: string,
  additionalInfo: string,
  status: string,               // pending, under_review, approved, rejected
  submittedDate: string,        // ISO date
  reviewedDate: string,         // ISO date
  reviewedBy: string,           // Admin user ID
  reviewNotes: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### approved_spvs Collection

```typescript
{
  id: string,                   // Auto-generated
  applicationId: string,        // Reference to application
  userId: string,               // Firebase Auth UID
  companyName: string,
  walletAddress: string,
  status: string,               // active, suspended, inactive
  projectsCreated: number,
  totalFundingRaised: number,
  performanceScore: number,
  lastActivity: string,         // ISO date
  approvedDate: string,         // ISO date
  suspendedDate: string,        // ISO date
  suspensionReason: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Database Indexes

Create the following indexes in Firebase Console:

```javascript
// spv_applications collection
{
  fields: [
    { fieldPath: 'userId', order: 'ASCENDING' },
    { fieldPath: 'status', order: 'ASCENDING' },
  ];
}

{
  fields: [
    { fieldPath: 'status', order: 'ASCENDING' },
    { fieldPath: 'submittedDate', order: 'DESCENDING' },
  ];
}

// approved_spvs collection
{
  fields: [
    { fieldPath: 'status', order: 'ASCENDING' },
    { fieldPath: 'approvedDate', order: 'DESCENDING' },
  ];
}
```

## Email Notifications

### Template Configuration

Configure SendGrid templates for SPV notifications:

1. **spv_application_confirmation** - Sent when application is submitted
2. **spv_application_approved** - Sent when application is approved
3. **spv_application_rejected** - Sent when application is rejected
4. **admin_new_spv_application** - Sent to admins for new applications

### Template Variables

```typescript
// Application Confirmation
{
  companyName: string,
  contactPerson: string,
  applicationId: string,
  submittedDate: string
}

// Approval/Rejection
{
  companyName: string,
  contactPerson: string,
  applicationId: string,
  reviewNotes: string,
  reviewedDate: string
}
```

## Testing Strategy

### Unit Tests

Test the following components:

1. **Service Layer**
   - Application submission validation
   - Application review logic
   - Statistics calculation
   - Email notification triggers

2. **Controller Layer**
   - Authentication and authorization
   - Input validation
   - Response formatting
   - Error handling

3. **Integration Tests**
   - Complete application submission flow
   - Admin review workflow
   - Email delivery
   - Database consistency

### Test Data

```typescript
const testApplicationData = {
  companyName: 'PT Test Infrastructure',
  legalEntityType: 'PT (Perseroan Terbatas)',
  registrationNumber: 'TEST-12345',
  businessType: 'Infrastructure Development',
  businessDescription: 'Test infrastructure company',
  address: 'Jl. Test No. 123',
  city: 'Jakarta',
  province: 'DKI Jakarta',
  country: 'Indonesia',
  contactPerson: 'John Doe',
  email: 'test@example.com',
  phone: '+62812345678',
  annualRevenue: 'Rp 10-25 Billion',
  yearsOfOperation: 5,
  previousProjects: 'Test projects',
  walletAddress: '0x123...abc',
  walletType: 'Safe (Gnosis Safe)',
  signers: ['0x123...abc', '0x456...def'],
  threshold: 2,
  documents: {},
  hasLegalIssues: false,
  complianceAgreement: true,
  dataProcessingConsent: true,
  projectTypes: ['Toll Roads'],
  targetFundingRange: 'Rp 50-100 Billion',
};
```

## Security Considerations

### Access Control

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Admin endpoints require admin role
3. **Data Ownership**: Users can only access their own applications
4. **Input Validation**: All inputs are validated and sanitized

### Data Protection

1. **PII Handling**: Personal information is encrypted at rest
2. **Document Security**: File uploads are scanned and validated
3. **Audit Trail**: All actions are logged for compliance
4. **GDPR Compliance**: Data retention and deletion policies

## Performance Optimization

### Database Optimization

1. **Indexes**: Proper indexing for query performance
2. **Pagination**: Large result sets are paginated
3. **Caching**: Frequently accessed data is cached
4. **Connection Pooling**: Efficient database connections

### API Optimization

1. **Response Compression**: Large responses are compressed
2. **Rate Limiting**: Prevents API abuse
3. **Caching Headers**: Proper cache control headers
4. **Async Processing**: Heavy operations are asynchronous

## Monitoring and Alerting

### Key Metrics

1. **Application Submission Rate**: Track new applications per day
2. **Review Time**: Average time from submission to review
3. **Approval Rate**: Percentage of applications approved
4. **API Performance**: Response times and error rates

### Alerts

1. **High Error Rate**: Alert when API errors exceed threshold
2. **Pending Applications**: Alert when applications await review
3. **Email Delivery**: Alert on email delivery failures
4. **Database Performance**: Alert on slow queries

## Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Database indexes created
- [ ] Email templates configured
- [ ] Environment variables set
- [ ] Security headers configured

### Post-deployment

- [ ] Health checks passing
- [ ] Email delivery working
- [ ] Admin notifications functional
- [ ] Frontend integration working
- [ ] Monitoring and alerts active

## Troubleshooting

### Common Issues

1. **Application Submission Fails**
   - Check JWT token validity
   - Verify request body format
   - Check database connection

2. **Email Notifications Not Sent**
   - Verify SendGrid configuration
   - Check email template IDs
   - Review email delivery logs

3. **Admin Panel Not Loading Data**
   - Check API endpoint accessibility
   - Verify admin role permissions
   - Review network connectivity

### Debug Mode

Enable debug logging in development:

```typescript
// In environment config
DEBUG_LEVEL: 'debug',
LOG_REQUESTS: true,
LOG_RESPONSES: true
```

This integration guide ensures seamless operation of the SPV applications system
across all platform components.
