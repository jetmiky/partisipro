# SPV Applications API Documentation

## Overview

The SPV Applications API provides comprehensive endpoints for managing Special
Purpose Vehicle (SPV) applications within the Partisipro platform. This API
supports the complete lifecycle of SPV applications from submission to approval
and ongoing management.

## Base URL

```
Development: http://localhost:3001/api/spv-applications
Production: https://api.partisipro.com/api/spv-applications
```

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Admin-only endpoints additionally require the `admin` role.

## API Endpoints

### 1. Submit SPV Application

Submit a new SPV application for review.

**Endpoint:** `POST /`  
**Authentication:** Required  
**Role:** Any authenticated user

#### Request Body

```typescript
{
  // Company Information
  companyName: string;
  legalEntityType: "PT (Perseroan Terbatas)" | "CV (Comanditaire Vennootschap)" | "Firma" | "Koperasi" | "Yayasan" | "Perkumpulan" | "BUMN" | "BUMD";
  registrationNumber: string;
  taxId?: string;
  yearEstablished?: string;
  businessType: "Infrastructure Development" | "Construction" | "Energy & Utilities" | "Transportation" | "Real Estate" | "Technology" | "Healthcare" | "Education" | "Manufacturing" | "Other";
  businessDescription: string;
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
  phone: string; // Indonesian format
  alternatePhone?: string;

  // Financial Information
  annualRevenue: "Under Rp 1 Billion" | "Rp 1-5 Billion" | "Rp 5-10 Billion" | "Rp 10-25 Billion" | "Rp 25-50 Billion" | "Rp 50-100 Billion" | "Over Rp 100 Billion";
  yearsOfOperation: number; // 0-100
  previousProjects: string;

  // Multi-signature Wallet
  walletAddress: string;
  walletType: "Safe (Gnosis Safe)" | "Other Multi-Sig";
  signers: string[]; // Array of wallet addresses
  threshold: number; // Must be <= signers.length

  // Documents (file IDs from file upload service)
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
  projectTypes: Array<"Toll Roads" | "Airports" | "Seaports" | "Railways" | "Power Plants" | "Water Treatment" | "Hospitals" | "Schools" | "Housing" | "Industrial Parks" | "Smart Cities" | "Renewable Energy">;
  targetFundingRange: "Under Rp 10 Billion" | "Rp 10-50 Billion" | "Rp 50-100 Billion" | "Rp 100-500 Billion" | "Rp 500 Billion - 1 Trillion" | "Over Rp 1 Trillion";
  additionalInfo?: string;
}
```

#### Response

```typescript
{
  success: true,
  message: "SPV application submitted successfully",
  data: {
    application: SPVApplication
  }
}
```

#### Error Responses

- `400 Bad Request`: Invalid application data or existing application found
- `401 Unauthorized`: Missing or invalid JWT token
- `422 Unprocessable Entity`: Validation errors

### 2. Get All SPV Applications (Admin Only)

Retrieve all SPV applications with optional filtering.

**Endpoint:** `GET /`  
**Authentication:** Required  
**Role:** Admin only

#### Query Parameters

- `status?`: Filter by status (`pending`, `under_review`, `approved`,
  `rejected`)
- `limit?`: Number of applications to return (default: 50, max: 100)
- `startAfter?`: Pagination cursor for next page

#### Response

```typescript
{
  success: true,
  message: "SPV applications retrieved successfully",
  data: {
    applications: SPVApplication[],
    hasMore: boolean
  }
}
```

### 3. Get My Application

Get the current user's SPV application.

**Endpoint:** `GET /my-application`  
**Authentication:** Required  
**Role:** Any authenticated user

#### Response

```typescript
{
  success: true,
  message: "SPV application retrieved successfully" | "No SPV application found",
  data: {
    application: SPVApplication | null
  }
}
```

### 4. Get SPV Statistics (Admin Only)

Get comprehensive SPV statistics for admin dashboard.

**Endpoint:** `GET /stats`  
**Authentication:** Required  
**Role:** Admin only

#### Response

```typescript
{
  success: true,
  message: "SPV statistics retrieved successfully",
  data: {
    pendingApplications: number,
    approvedSPVs: number,
    totalProjectsCreated: number,
    totalFundingFacilitated: number
  }
}
```

### 5. Get Approved SPVs (Admin Only)

Get all approved SPVs for admin management.

**Endpoint:** `GET /approved`  
**Authentication:** Required  
**Role:** Admin only

#### Query Parameters

- `limit?`: Number of SPVs to return (default: 50)
- `startAfter?`: Pagination cursor

#### Response

```typescript
{
  success: true,
  message: "Approved SPVs retrieved successfully",
  data: {
    spvs: ApprovedSPV[],
    hasMore: boolean
  }
}
```

### 6. Get Application by ID

Get a specific SPV application by ID.

**Endpoint:** `GET /:id`  
**Authentication:** Required  
**Role:** Any authenticated user (with access control)

#### Response

```typescript
{
  success: true,
  message: "SPV application retrieved successfully",
  data: {
    application: SPVApplication
  }
}
```

### 7. Update SPV Application

Update a pending SPV application.

**Endpoint:** `PUT /:id`  
**Authentication:** Required  
**Role:** Application owner only

#### Request Body

Partial update object with same structure as submit request.

#### Response

```typescript
{
  success: true,
  message: "SPV application updated successfully",
  data: {
    application: SPVApplication
  }
}
```

#### Error Responses

- `400 Bad Request`: Invalid update data or application cannot be updated
- `403 Forbidden`: User can only update their own application
- `404 Not Found`: Application not found

### 8. Review SPV Application (Admin Only)

Review and approve/reject an SPV application.

**Endpoint:** `POST /review`  
**Authentication:** Required  
**Role:** Admin only

#### Request Body

```typescript
{
  applicationId: string;
  action: "approve" | "reject";
  reviewNotes?: string;
}
```

#### Response

```typescript
{
  success: true,
  message: "SPV application approved/rejected successfully",
  data: {
    application: SPVApplication
  }
}
```

### 9. Suspend Approved SPV (Admin Only)

Suspend an approved SPV.

**Endpoint:** `POST /approved/:id/suspend`  
**Authentication:** Required  
**Role:** Admin only

#### Request Body

```typescript
{
  reason: string;
}
```

#### Response

```typescript
{
  success: true,
  message: "SPV suspended successfully"
}
```

### 10. Activate Suspended SPV (Admin Only)

Reactivate a suspended SPV.

**Endpoint:** `POST /approved/:id/activate`  
**Authentication:** Required  
**Role:** Admin only

#### Response

```typescript
{
  success: true,
  message: "SPV activated successfully"
}
```

### 11. Delete SPV Application

Delete a non-approved SPV application.

**Endpoint:** `DELETE /:id`  
**Authentication:** Required  
**Role:** Application owner only

#### Response

```typescript
{
  success: true,
  message: "SPV application deleted successfully"
}
```

#### Error Responses

- `400 Bad Request`: Approved applications cannot be deleted
- `403 Forbidden`: User can only delete their own application

## Data Models

### SPVApplication

```typescript
interface SPVApplication {
  id: string;
  userId: string;
  companyName: string;
  legalEntityType: string;
  registrationNumber: string;
  taxId?: string;
  yearEstablished?: string;
  businessType: string;
  businessDescription: string;
  address: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
  website?: string;
  contactPerson: string;
  contactTitle?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  annualRevenue: string;
  yearsOfOperation: number;
  previousProjects: string;
  walletAddress: string;
  walletType: string;
  signers: string[];
  threshold: number;
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
  hasLegalIssues: boolean;
  legalIssuesDescription?: string;
  complianceAgreement: boolean;
  dataProcessingConsent: boolean;
  projectTypes: string[];
  targetFundingRange: string;
  additionalInfo?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedDate: string;
  reviewedDate?: string;
  reviewedBy?: string;
  reviewNotes?: string;
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

## Workflow

### SPV Application Workflow

1. **Submission**: User submits SPV application via frontend form
2. **Validation**: Backend validates all required fields and documents
3. **Notification**: Admin receives notification of new application
4. **Review**: Admin reviews application and supporting documents
5. **Decision**: Admin approves or rejects with optional notes
6. **Notification**: Applicant receives email notification of decision
7. **SPV Creation**: If approved, SPV record is created for platform access

### Application States

- **pending**: Initial state after submission
- **under_review**: Admin has started reviewing (optional intermediate state)
- **approved**: Application approved, SPV can access platform
- **rejected**: Application rejected with reason

### Business Rules

1. One application per user (cannot submit multiple applications)
2. Only pending applications can be updated
3. Approved applications cannot be deleted
4. Multi-sig threshold must not exceed number of signers
5. All boolean compliance fields must be true for approval consideration
6. Document uploads are optional but recommended for approval

## Error Handling

### Common Error Codes

- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `422`: Unprocessable Entity - Validation errors

### Error Response Format

```typescript
{
  success: false,
  message: string,
  error?: string,
  details?: any
}
```

## Integration Notes

### Frontend Integration

The API is designed to work with the existing frontend SPV application form at
`/spv/apply`. The form structure matches the API request body exactly.

### Admin Integration

Admin endpoints integrate with the existing admin dashboard at `/admin/spv` to
display real SPV data instead of mock data.

### File Upload Integration

Document uploads should be handled separately through a file upload service,
with file IDs referenced in the documents object.

### Email Notifications

The system automatically sends email notifications for:

- Application submission confirmation
- Application approval/rejection
- Admin notifications for new applications

## Testing

### Test Data

Use the following test data for development:

```typescript
const testApplication = {
  companyName: 'PT Infrastruktur Maju',
  legalEntityType: 'PT (Perseroan Terbatas)',
  registrationNumber: 'AHU-12345678',
  businessType: 'Infrastructure Development',
  businessDescription: 'Specialized in toll road development',
  // ... other required fields
};
```

### Testing Endpoints

1. Test application submission with valid data
2. Test admin approval/rejection workflow
3. Test application updates and restrictions
4. Test pagination for large datasets
5. Test role-based access control

## Performance Considerations

- Applications are paginated with configurable limits
- Firebase queries are optimized with appropriate indexes
- Large document uploads should be handled separately
- Caching is implemented for frequently accessed data

## Security

- All endpoints require JWT authentication
- Role-based access control for admin operations
- Input validation on all fields
- SQL injection protection via Firebase
- Rate limiting to prevent abuse
