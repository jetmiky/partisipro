# Profiling API Endpoints Documentation

## Overview

The Profiling API provides comprehensive investor profiling capabilities for the
Partisipro platform. This service collects, processes, and analyzes investor
profiles to generate personalized investment recommendations and risk
assessments.

## Base URL

- **Development**: `http://localhost:3001/api/v1/profiling`
- **Production**: `https://api.partisipro.com/v1/profiling`

## Authentication

All endpoints require JWT Bearer token authentication:

```
Authorization: Bearer <jwt_token>
```

## Key Features

- **Investor Risk Assessment**: Comprehensive risk scoring based on multiple
  factors
- **Investment Recommendations**: Personalized token allocation recommendations
- **Profile Analytics**: Detailed profile completion and strength metrics
- **Admin Management**: Bulk operations and statistics for administrators
- **Data Export**: Compliance-ready data export capabilities

## Core Endpoints

### 1. Submit Profile

**POST** `/submit`

Submits a complete investor profiling questionnaire.

**Request Body:**

```json
{
  "age": "26-35",
  "income": "10.1-20M",
  "experience": "1-3years",
  "knownInvestments": ["savings", "mutual_funds", "stocks"],
  "investmentGoal": "long_term_growth",
  "riskTolerance": "moderate",
  "marketReaction": "worry_wait",
  "holdingPeriod": "3-5years",
  "projectDetailImportance": "important",
  "tokenTypes": ["debt_token", "hybrid_token"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "profileId": "profile_uuid",
    "userId": "user_uuid",
    "riskAssessment": {
      "riskLevel": "medium",
      "riskScore": 65,
      "suitableProducts": ["debt_token", "hybrid_token", "revenue_token"],
      "recommendations": [
        "Campurkan token utang dan ekuitas untuk keseimbangan",
        "Pertimbangkan token hibrida untuk fleksibilitas",
        "Alokasikan 60-70% pada token konservatif"
      ]
    },
    "nextStep": "/kyc",
    "completedAt": "2024-01-14T10:00:00Z"
  },
  "message": "Profil investor berhasil disimpan"
}
```

**Backend Implementation Notes:**

- The backend receives the profile data and forwards it to an external profiling
  service
- Backend expects a 200 OK response from the external service
- Risk assessment is calculated using the algorithm in
  `/lib/validation/profiling.ts`
- All validation should be performed before forwarding to external service

### 2. Get Profile

**GET** `/profile/:userId`

Retrieves the investor profile for a specific user.

**Parameters:**

- `userId` (string): The UUID of the user

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "profile_uuid",
    "userId": "user_uuid",
    "age": "26-35",
    "income": "10.1-20M",
    "experience": "1-3years",
    "knownInvestments": ["savings", "mutual_funds", "stocks"],
    "investmentGoal": "long_term_growth",
    "riskTolerance": "moderate",
    "marketReaction": "worry_wait",
    "holdingPeriod": "3-5years",
    "projectDetailImportance": "important",
    "tokenTypes": ["debt_token", "hybrid_token"],
    "riskAssessment": {
      "riskLevel": "medium",
      "riskScore": 65,
      "suitableProducts": ["debt_token", "hybrid_token", "revenue_token"],
      "recommendations": [
        "Campurkan token utang dan ekuitas untuk keseimbangan",
        "Pertimbangkan token hibrida untuk fleksibilitas"
      ]
    },
    "createdAt": "2024-01-14T10:00:00Z",
    "updatedAt": "2024-01-14T10:00:00Z",
    "completedAt": "2024-01-14T10:00:00Z"
  }
}
```

### 3. Update Profile

**PATCH** `/profile/:userId`

Updates specific fields in an existing investor profile.

**Parameters:**

- `userId` (string): The UUID of the user

**Request Body:**

```json
{
  "riskTolerance": "aggressive",
  "tokenTypes": ["equity_token", "hybrid_token"],
  "investmentGoal": "diversification"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "profileId": "profile_uuid",
    "updatedFields": ["riskTolerance", "tokenTypes", "investmentGoal"],
    "newRiskAssessment": {
      "riskLevel": "high",
      "riskScore": 78,
      "suitableProducts": ["equity_token", "hybrid_token", "revenue_token"],
      "recommendations": [
        "Eksplor token ekuitas untuk potensi capital gain",
        "Pertimbangkan proyek inovatif dengan potensi tinggi"
      ]
    },
    "updatedAt": "2024-01-14T10:00:00Z"
  },
  "message": "Profil investor berhasil diperbarui"
}
```

### 4. Risk Assessment

**GET** `/risk-assessment/:userId`

Retrieves detailed risk assessment for a user's profile.

**Parameters:**

- `userId` (string): The UUID of the user

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "riskLevel": "medium",
    "riskScore": 65,
    "suitableProducts": ["debt_token", "hybrid_token", "revenue_token"],
    "recommendations": [
      "Campurkan token utang dan ekuitas untuk keseimbangan",
      "Pertimbangkan token hibrida untuk fleksibilitas",
      "Alokasikan 60-70% pada token konservatif"
    ],
    "calculatedAt": "2024-01-14T10:00:00Z",
    "basedOnProfile": {
      "age": "26-35",
      "income": "10.1-20M",
      "experience": "1-3years",
      "riskTolerance": "moderate",
      "marketReaction": "worry_wait",
      "holdingPeriod": "3-5years"
    }
  }
}
```

### 5. Investment Recommendations

**GET** `/recommendations/:userId`

Provides personalized investment recommendations based on the user's profile.

**Parameters:**

- `userId` (string): The UUID of the user

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "tokenType": "debt_token",
      "allocationPercentage": 40,
      "reasoning": "Sesuai dengan profil risiko moderat dan preferensi stabilitas",
      "riskLevel": "low",
      "expectedReturn": "8-12% per tahun",
      "priority": "high"
    },
    {
      "tokenType": "hybrid_token",
      "allocationPercentage": 35,
      "reasoning": "Memberikan keseimbangan antara stabilitas dan pertumbuhan",
      "riskLevel": "medium",
      "expectedReturn": "10-15% per tahun",
      "priority": "high"
    },
    {
      "tokenType": "revenue_token",
      "allocationPercentage": 25,
      "reasoning": "Cocok untuk tujuan investasi jangka panjang",
      "riskLevel": "medium",
      "expectedReturn": "12-18% per tahun",
      "priority": "medium"
    }
  ]
}
```

## Admin Endpoints

### 6. Profile Statistics

**GET** `/admin/statistics`

**Auth**: Admin role required

Provides comprehensive statistics about all investor profiles.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalProfiles": 1250,
    "completedProfiles": 1180,
    "completionRate": 94.4,
    "riskDistribution": {
      "low": 320,
      "medium": 650,
      "high": 210
    },
    "popularInvestmentTypes": {
      "debt_token": 850,
      "hybrid_token": 720,
      "revenue_token": 680,
      "equity_token": 450
    },
    "ageDistribution": {
      "<=25": 125,
      "26-35": 485,
      "36-45": 390,
      "46-55": 180,
      ">55": 70
    },
    "incomeDistribution": {
      "<=5M": 185,
      "5.1-10M": 320,
      "10.1-20M": 425,
      "20.1-50M": 250,
      ">50M": 70
    },
    "experienceDistribution": {
      "never": 145,
      "<1year": 265,
      "1-3years": 420,
      "3-5years": 285,
      ">5years": 135
    },
    "averageRiskScore": 58.5,
    "profilesCreatedToday": 12,
    "profilesUpdatedToday": 34,
    "topInvestmentGoals": {
      "long_term_growth": 485,
      "regular_income": 320,
      "diversification": 285,
      "inflation_hedge": 160
    }
  }
}
```

### 7. Bulk Import

**POST** `/admin/bulk-import`

**Auth**: Admin role required

Imports multiple profiles from CSV or JSON file.

**Request Body (multipart/form-data):**

```
file: File object
format: "csv" | "json"
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "imported": 450,
    "failed": 12,
    "skipped": 5,
    "errors": [
      {
        "row": 15,
        "error": "Invalid age range value",
        "data": { "age": "invalid_age" }
      }
    ],
    "summary": {
      "totalRows": 467,
      "successRate": 96.4,
      "processingTime": "2.3 seconds"
    }
  }
}
```

### 8. Completion Funnel

**GET** `/admin/completion-funnel`

**Auth**: Admin role required

Provides analytics on profile completion rates and drop-off points.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "started": 1450,
    "section1Completed": 1320,
    "section2Completed": 1180,
    "fullyCompleted": 1180,
    "conversionRate": 81.4,
    "dropoffPoints": {
      "section1": 130,
      "section2": 140,
      "final_submit": 0
    },
    "averageCompletionTime": "4.2 minutes",
    "completionTrends": [
      {
        "date": "2024-01-14",
        "started": 45,
        "completed": 38,
        "conversionRate": 84.4
      }
    ]
  }
}
```

## Utility Endpoints

### 9. Profile Analytics

**GET** `/analytics/:userId`

Comprehensive analytics about a specific user's profile.

**Parameters:**

- `userId` (string): The UUID of the user

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "completionRate": 100,
    "sectionCompletionStatus": {
      "demographics": true,
      "preferences": true
    },
    "riskAssessment": {
      "riskLevel": "medium",
      "riskScore": 65,
      "suitableProducts": ["debt_token", "hybrid_token", "revenue_token"],
      "recommendations": [
        "Campurkan token utang dan ekuitas untuk keseimbangan"
      ]
    },
    "recommendations": [
      {
        "tokenType": "debt_token",
        "allocationPercentage": 40,
        "reasoning": "Sesuai dengan profil risiko moderat",
        "riskLevel": "low",
        "expectedReturn": "8-12% per tahun"
      }
    ],
    "profileStrength": {
      "score": 95,
      "factors": {
        "completeness": 100,
        "consistency": 95,
        "riskAlignment": 90
      }
    },
    "matchingProjects": 42,
    "potentialReturns": {
      "conservative": "8-12%",
      "moderate": "12-18%",
      "aggressive": "18-25%"
    }
  }
}
```

### 10. Profile Completion Status

**GET** `/completion/:userId`

Checks if a user's profile is complete and returns completion details.

**Parameters:**

- `userId` (string): The UUID of the user

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "completed": true,
    "completionRate": 100,
    "missingFields": [],
    "requiredSections": {
      "demographics": true,
      "preferences": true
    },
    "lastUpdated": "2024-01-14T10:00:00Z"
  }
}
```

### 11. Export Profile Data

**GET** `/export/:userId`

Exports user profile data in various formats for compliance purposes.

**Parameters:**

- `userId` (string): The UUID of the user

**Query Parameters:**

- `format` (optional): "json" | "csv" | "pdf" (default: "json")

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "exportId": "export_uuid",
    "downloadUrl": "https://storage.example.com/exports/profile-data.pdf",
    "expiresAt": "2024-01-21T10:00:00Z",
    "fileSize": "245 KB",
    "format": "pdf",
    "status": "ready"
  }
}
```

### 12. Delete Profile

**DELETE** `/profile/:userId`

Permanently deletes a user's profile data.

**Parameters:**

- `userId` (string): The UUID of the user

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "deletedProfileId": "profile_uuid",
    "userId": "user_uuid",
    "deletedAt": "2024-01-14T10:00:00Z"
  },
  "message": "Profil investor berhasil dihapus"
}
```

### 13. Generate Profile Report

**GET** `/report/:userId`

Generates a comprehensive profile report including all analytics and
recommendations.

**Parameters:**

- `userId` (string): The UUID of the user

**Query Parameters:**

- `includeRecommendations` (optional): boolean (default: true)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "profile_uuid",
      "userId": "user_uuid",
      "age": "26-35",
      "income": "10.1-20M",
      "experience": "1-3years",
      "completedAt": "2024-01-14T10:00:00Z"
    },
    "riskAssessment": {
      "riskLevel": "medium",
      "riskScore": 65,
      "suitableProducts": ["debt_token", "hybrid_token", "revenue_token"],
      "recommendations": [
        "Campurkan token utang dan ekuitas untuk keseimbangan"
      ]
    },
    "recommendations": [
      {
        "tokenType": "debt_token",
        "allocationPercentage": 40,
        "reasoning": "Sesuai dengan profil risiko moderat",
        "riskLevel": "low",
        "expectedReturn": "8-12% per tahun"
      }
    ],
    "analytics": {
      "completionRate": 100,
      "profileStrength": {
        "score": 95,
        "factors": {
          "completeness": 100,
          "consistency": 95,
          "riskAlignment": 90
        }
      },
      "matchingProjects": 42,
      "potentialReturns": {
        "conservative": "8-12%",
        "moderate": "12-18%",
        "aggressive": "18-25%"
      }
    },
    "generatedAt": "2024-01-14T10:00:00Z",
    "reportId": "report_uuid"
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "PROFILE_001",
    "message": "Profile not found",
    "details": {
      "userId": "user_uuid",
      "timestamp": "2024-01-14T10:00:00Z"
    }
  }
}
```

### Error Codes

- `PROFILE_001`: Profile not found
- `PROFILE_002`: Profile already exists
- `PROFILE_003`: Invalid age range
- `PROFILE_004`: Invalid income range
- `PROFILE_005`: Invalid experience level
- `PROFILE_006`: Invalid investment type
- `PROFILE_007`: Invalid investment goal
- `PROFILE_008`: Invalid risk tolerance
- `PROFILE_009`: Invalid market reaction
- `PROFILE_010`: Invalid holding period
- `PROFILE_011`: Invalid project detail importance
- `PROFILE_012`: Invalid token type
- `PROFILE_013`: Incomplete profile data
- `PROFILE_014`: Risk assessment failed
- `PROFILE_015`: Profile validation failed
- `PROFILE_016`: External API unavailable
- `PROFILE_017`: Profile export failed
- `PROFILE_018`: Bulk import failed
- `PROFILE_019`: Profile locked for editing
- `PROFILE_020`: Profile submission timeout

## Data Validation

### Required Fields

All fields in the profile submission are required:

- `age`: Must be one of the valid age ranges
- `income`: Must be one of the valid income ranges
- `experience`: Must be one of the valid experience levels
- `knownInvestments`: Array of valid investment types (minimum 1)
- `investmentGoal`: Must be one of the valid investment goals
- `riskTolerance`: Must be one of the valid risk tolerance levels
- `marketReaction`: Must be one of the valid market reactions
- `holdingPeriod`: Must be one of the valid holding periods
- `projectDetailImportance`: Must be one of the valid importance levels
- `tokenTypes`: Array of valid token types (minimum 1)

### Valid Values

Refer to the TypeScript enums in `/types/profiling.ts` for complete lists of
valid values:

- `AgeRange`: "<=25", "26-35", "36-45", "46-55", ">55"
- `IncomeRange`: "<=5M", "5.1-10M", "10.1-20M", "20.1-50M", ">50M"
- `ExperienceLevel`: "never", "<1year", "1-3years", "3-5years", ">5years"
- `InvestmentType`: "savings", "mutual_funds", "stocks", "bonds", "property",
  "gold", "crypto", "others"
- `InvestmentGoal`: "long_term_growth", "regular_income", "inflation_hedge",
  "medium_term_goals", "diversification"
- `RiskTolerance`: "very_conservative", "conservative", "moderate",
  "aggressive", "very_aggressive"
- `MarketReaction`: "panic_sell", "worry_wait", "buy_more", "no_worry_long_term"
- `HoldingPeriod`: "<1year", "1-3years", "3-5years", ">5years"
- `ProjectDetailImportance`: "very_important", "important", "not_important"
- `TokenType`: "debt_token", "equity_token", "revenue_token", "hybrid_token",
  "unsure"

## Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **Admin endpoints**: 50 requests per minute
- **Export endpoints**: 10 requests per hour
- **Bulk import**: 5 requests per hour

## Security Considerations

1. **Input Validation**: All inputs are validated against predefined enums
2. **User Authorization**: Users can only access their own profiles
3. **Admin Authorization**: Admin endpoints require admin role verification
4. **Data Sanitization**: All profile data is sanitized before storage
5. **Export Security**: Export URLs expire after 7 days
6. **Audit Logging**: All profile modifications are logged

## Backend Implementation Guidelines

### External API Integration

The backend should implement the following flow for the `/submit` endpoint:

1. **Receive Request**: Accept the profile data from the frontend
2. **Validate Data**: Perform server-side validation using the same rules as
   frontend
3. **Calculate Risk Assessment**: Use the risk calculation algorithm
4. **Forward to External API**: Send the validated data to the external
   profiling service
5. **Handle External Response**: Process the 200 OK response from external
   service
6. **Store Data**: Save the profile and risk assessment to the database
7. **Return Response**: Send success response to frontend

### Database Schema

The backend should store the following data structure:

```json
{
  "id": "profile_uuid",
  "userId": "user_uuid",
  "profileData": {
    "age": "26-35",
    "income": "10.1-20M",
    "experience": "1-3years",
    "knownInvestments": ["savings", "mutual_funds", "stocks"],
    "investmentGoal": "long_term_growth",
    "riskTolerance": "moderate",
    "marketReaction": "worry_wait",
    "holdingPeriod": "3-5years",
    "projectDetailImportance": "important",
    "tokenTypes": ["debt_token", "hybrid_token"]
  },
  "riskAssessment": {
    "riskLevel": "medium",
    "riskScore": 65,
    "suitableProducts": ["debt_token", "hybrid_token", "revenue_token"],
    "recommendations": ["recommendation1", "recommendation2"]
  },
  "createdAt": "2024-01-14T10:00:00Z",
  "updatedAt": "2024-01-14T10:00:00Z",
  "completedAt": "2024-01-14T10:00:00Z",
  "externalApiResponse": {
    "success": true,
    "timestamp": "2024-01-14T10:00:00Z"
  }
}
```

### Performance Considerations

- **Caching**: Implement caching for frequently accessed profiles
- **Database Indexing**: Index userId and createdAt fields
- **Batch Processing**: Use batch operations for bulk import
- **Async Processing**: Use queues for non-critical operations like export
  generation
- **Rate Limiting**: Implement rate limiting to prevent abuse

This comprehensive API documentation provides all the necessary information for
implementing the profiling backend endpoints that will forward data to external
services while maintaining the expected response format for frontend
integration.
