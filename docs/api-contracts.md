# API Contract Definitions for Backend Integration

## Overview

This document defines the complete API specifications required for backend
integration with the Partisipro frontend platform. All endpoints follow RESTful
principles with consistent error handling and authentication patterns.

## Authentication

All authenticated endpoints require JWT Bearer token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Base URLs

- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://api.partisipro.com/v1`

## Response Format Standards

### Success Response

```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message",
  "timestamp": "2024-01-14T10:30:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {...}
  },
  "timestamp": "2024-01-14T10:30:00Z"
}
```

## Authentication Endpoints

### POST /auth/signin

**Purpose**: User authentication with email/password

```json
// Request
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// Response
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_uuid",
      "email": "user@example.com",
      "role": "investor|spv|admin",
      "identityVerified": true,
      "kycStatus": "approved|pending|rejected"
    }
  }
}
```

### POST /auth/signup

**Purpose**: User registration

```json
// Request
{
  "email": "user@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "userType": "investor|spv",
  "acceptTerms": true
}

// Response - Same as signin
```

### POST /auth/refresh

**Purpose**: Refresh JWT token

```json
// Request
{
  "refreshToken": "refresh_token_here"
}

// Response - New token pair
```

### POST /auth/logout

**Purpose**: Logout user and invalidate tokens

```json
// Request
{
  "refreshToken": "refresh_token_here"
}

// Response
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Investor Profiling Endpoints

### POST /profiling/submit

**Purpose**: Submit investor profiling questionnaire **Auth**: Required

```json
// Request
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

// Response
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

### GET /profiling/profile/:userId

**Purpose**: Get investor profile by user ID **Auth**: Required

```json
// Response
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

### PATCH /profiling/profile/:userId

**Purpose**: Update investor profile **Auth**: Required

```json
// Request
{
  "riskTolerance": "aggressive",
  "tokenTypes": ["equity_token", "hybrid_token"],
  "investmentGoal": "diversification"
}

// Response
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

### GET /profiling/risk-assessment/:userId

**Purpose**: Get risk assessment for a profile **Auth**: Required

```json
// Response
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

### GET /profiling/recommendations/:userId

**Purpose**: Get investment recommendations **Auth**: Required

```json
// Response
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

### GET /profiling/analytics/:userId

**Purpose**: Get profile analytics **Auth**: Required

```json
// Response
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

### GET /profiling/completion/:userId

**Purpose**: Check if profile is complete **Auth**: Required

```json
// Response
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

### DELETE /profiling/profile/:userId

**Purpose**: Delete investor profile **Auth**: Required

```json
// Response
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

### GET /profiling/export/:userId

**Purpose**: Export profile data (for compliance) **Auth**: Required

```json
// Query Parameters
{
  "format": "json|csv|pdf"
}

// Response
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

## Admin Profiling Endpoints

### GET /profiling/admin/statistics

**Purpose**: Get profile statistics (for admin) **Auth**: Required (Admin role)

```json
// Response
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

### POST /profiling/admin/bulk-import

**Purpose**: Bulk import profiles (for admin) **Auth**: Required (Admin role)

```json
// Request (multipart/form-data)
{
  "file": "File object",
  "format": "csv|json"
}

// Response
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

### GET /profiling/admin/completion-funnel

**Purpose**: Get profile completion funnel data **Auth**: Required (Admin role)

```json
// Response
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

### GET /profiling/report/:userId

**Purpose**: Generate comprehensive profile report **Auth**: Required

```json
// Query Parameters
{
  "includeRecommendations": true
}

// Response
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

## Identity & KYC Endpoints

### GET /identity/status

**Purpose**: Get user's identity verification status **Auth**: Required

```json
// Response
{
  "success": true,
  "data": {
    "identityId": "identity_uuid",
    "verificationLevel": "basic|advanced|institutional",
    "kycStatus": "approved|pending|rejected|not_started",
    "claimsCount": 4,
    "identityScore": 95,
    "accessibleProjects": 156,
    "restrictedProjects": 0,
    "claims": [
      {
        "type": "KYC_APPROVED",
        "issuer": "0x...",
        "issuedAt": "2024-01-10T10:00:00Z",
        "expiresAt": "2025-01-10T10:00:00Z",
        "status": "active"
      }
    ]
  }
}
```

### POST /identity/kyc/initiate

**Purpose**: Start KYC verification process **Auth**: Required

```json
// Request
{
  "provider": "verihubs|sumsubstance|jumio",
  "verificationType": "individual|corporate"
}

// Response
{
  "success": true,
  "data": {
    "sessionId": "kyc_session_uuid",
    "redirectUrl": "https://provider.com/verify?session=...",
    "estimatedDuration": "5-10 minutes",
    "requiredDocuments": ["national_id", "selfie", "proof_of_address"]
  }
}
```

### GET /identity/kyc/status/:sessionId

**Purpose**: Check KYC verification status **Auth**: Required

```json
// Response
{
  "success": true,
  "data": {
    "sessionId": "kyc_session_uuid",
    "status": "pending|in_review|approved|rejected",
    "progress": 75,
    "completedChecks": ["document", "facial", "liveness"],
    "pendingChecks": ["aml"],
    "estimatedCompletion": "2024-01-14T12:00:00Z",
    "rejectionReason": "document_quality|expired_document|facial_mismatch"
  }
}
```

## Project Management Endpoints

### GET /projects

**Purpose**: Get list of available projects **Auth**: Optional (affects
available projects)

```json
// Query Parameters
{
  "category": "transportation|energy|water|telecommunications|buildings",
  "status": "active|coming_soon|fully_funded|completed",
  "riskLevel": "low|medium|high",
  "minInvestment": 1000000,
  "maxInvestment": 10000000,
  "page": 1,
  "limit": 20,
  "sortBy": "created_at|target_amount|expected_return",
  "sortOrder": "asc|desc"
}

// Response
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project_uuid",
        "title": "Jakarta-Bandung High-Speed Rail Extension",
        "description": "Extension of high-speed rail connecting Jakarta to Bandung",
        "category": "transportation",
        "location": "Jakarta - Bandung",
        "province": "DKI Jakarta - Jawa Barat",
        "totalValue": 15000000000,
        "targetAmount": 5000000000,
        "raisedAmount": 2500000000,
        "minimumInvestment": 1000000,
        "expectedReturn": 12.5,
        "duration": 24,
        "startDate": "2024-02-01T00:00:00Z",
        "endDate": "2026-02-01T00:00:00Z",
        "status": "active",
        "investorCount": 150,
        "riskLevel": "medium",
        "image": "https://storage.example.com/projects/rail-extension.jpg",
        "highlights": [
          "Government guarantee",
          "Strategic infrastructure",
          "Stable revenue stream"
        ],
        "isEligible": true,
        "eligibilityReason": "identity_verified"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 98,
      "itemsPerPage": 20
    }
  }
}
```

### GET /projects/:id

**Purpose**: Get detailed project information **Auth**: Optional

```json
// Response
{
  "success": true,
  "data": {
    "id": "project_uuid",
    "title": "Jakarta-Bandung High-Speed Rail Extension",
    "description": "Detailed project description...",
    "detailedDescription": "Comprehensive project overview...",
    "category": "transportation",
    "location": "Jakarta - Bandung",
    "province": "DKI Jakarta - Jawa Barat",
    "totalValue": 15000000000,
    "targetAmount": 5000000000,
    "raisedAmount": 2500000000,
    "minimumInvestment": 1000000,
    "expectedReturn": 12.5,
    "duration": 24,
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2026-02-01T00:00:00Z",
    "status": "active",
    "investorCount": 150,
    "riskLevel": "medium",
    "image": "https://storage.example.com/projects/rail-extension.jpg",
    "highlights": [
      "Government guarantee",
      "Strategic infrastructure",
      "Stable revenue stream"
    ],
    "financialProjections": {
      "year1": {
        "revenue": 800000000,
        "profit": 120000000,
        "returnRate": 12.0
      },
      "year2": {
        "revenue": 850000000,
        "profit": 127500000,
        "returnRate": 12.8
      }
    },
    "risks": [
      {
        "level": "Medium",
        "description": "Construction delays due to weather",
        "probability": 25
      }
    ],
    "legalDocuments": [
      {
        "name": "Project Feasibility Study",
        "size": "2.5 MB",
        "type": "PDF",
        "url": "https://storage.example.com/docs/feasibility.pdf"
      }
    ],
    "updates": [
      {
        "date": "2024-01-10T10:00:00Z",
        "title": "Construction Milestone Achieved",
        "description": "Phase 1 construction completed ahead of schedule"
      }
    ],
    "keyMetrics": {
      "irr": 13.2,
      "roiProjected": 12.5,
      "paybackPeriod": 8.5
    },
    "isEligible": true,
    "eligibilityReason": "identity_verified",
    "contractAddresses": {
      "projectToken": "0x...",
      "offering": "0x...",
      "treasury": "0x...",
      "governance": "0x..."
    }
  }
}
```

### POST /projects/:id/invest

**Purpose**: Create investment in project **Auth**: Required

```json
// Request
{
  "amount": 5000000,
  "paymentMethod": "bank_transfer|digital_wallet",
  "acceptRisks": true,
  "acceptTerms": true
}

// Response
{
  "success": true,
  "data": {
    "investmentId": "investment_uuid",
    "projectId": "project_uuid",
    "amount": 5000000,
    "tokenAmount": 5000,
    "status": "pending_payment",
    "paymentInstructions": {
      "method": "bank_transfer",
      "bankAccount": {
        "accountNumber": "1234567890",
        "bankName": "Bank Central Asia",
        "accountName": "PT Partisipro Escrow"
      },
      "referenceNumber": "INV-20240114-001",
      "expiresAt": "2024-01-15T10:00:00Z"
    },
    "transactionHash": null,
    "createdAt": "2024-01-14T10:00:00Z"
  }
}
```

## Portfolio & Analytics Endpoints

### GET /portfolio

**Purpose**: Get user's investment portfolio **Auth**: Required

```json
// Response
{
  "success": true,
  "data": {
    "summary": {
      "totalInvested": 11500000,
      "currentValue": 12935000,
      "totalReturns": 1435000,
      "returnPercentage": 12.5,
      "activeProjects": 3,
      "completedProjects": 1,
      "claimableAmount": 280000
    },
    "investments": [
      {
        "id": "investment_uuid",
        "projectId": "project_uuid",
        "projectTitle": "Jakarta-Bandung High-Speed Rail Extension",
        "investmentAmount": 5000000,
        "currentValue": 5750000,
        "returnAmount": 750000,
        "returnPercentage": 15.0,
        "status": "active",
        "investmentDate": "2024-01-15T10:00:00Z",
        "lastUpdate": "2024-01-10T10:00:00Z",
        "nextPayment": "2024-02-15T10:00:00Z",
        "category": "transportation",
        "riskLevel": "medium",
        "tokenAmount": 5000,
        "tokenAddress": "0x..."
      }
    ]
  }
}
```

### GET /portfolio/analytics

**Purpose**: Get comprehensive portfolio analytics **Auth**: Required

```json
// Query Parameters
{
  "timeRange": "1M|3M|6M|1Y|ALL",
  "includeProjections": true
}

// Response
{
  "success": true,
  "data": {
    "crossProjectMetrics": {
      "totalProjects": 4,
      "activeProjects": 3,
      "completedProjects": 1,
      "totalInvested": 11500000,
      "totalCurrentValue": 12935000,
      "totalReturns": 1435000,
      "averageROI": 12.5,
      "portfolioDiversification": [
        {
          "category": "transportation",
          "count": 2,
          "investedAmount": 8000000,
          "currentValue": 8990000,
          "percentage": 72.7,
          "averageROI": 12.4
        }
      ],
      "riskDistribution": [
        {
          "riskLevel": "low",
          "count": 2,
          "investedAmount": 4500000,
          "currentValue": 4905000,
          "percentage": 40.9,
          "averageROI": 9.0
        }
      ],
      "monthlyPerformance": [
        {
          "month": "2024-01",
          "totalValue": 12935000,
          "returns": 1435000,
          "roi": 12.5,
          "newInvestments": 0,
          "claimedReturns": 185000
        }
      ]
    },
    "portfolioComparison": [
      {
        "projectId": "project_uuid",
        "projectName": "Jakarta-Bandung High-Speed Rail Extension",
        "category": "transportation",
        "investedAmount": 5000000,
        "currentValue": 5750000,
        "roi": 15.0,
        "riskLevel": "medium",
        "duration": 45,
        "status": "active",
        "lastUpdate": "2024-01-10T10:00:00Z",
        "performanceRank": 1,
        "diversificationScore": 78.5
      }
    ],
    "platformBenchmarks": {
      "averageROI": 11.8,
      "averageInvestmentSize": 2875000,
      "averageProjectDuration": 18,
      "topPerformingCategory": "energy",
      "platformGrowthRate": 24.7,
      "userPerformancePercentile": 78
    },
    "identityInsights": {
      "verificationLevel": "advanced",
      "claimsCount": 4,
      "identityScore": 95,
      "accessibleProjects": 156,
      "restrictedProjects": 0,
      "identityBenefits": [
        "One-time verification for all projects",
        "Instant investment approval",
        "Access to premium projects"
      ],
      "identityUtilization": {
        "investmentVolume": 88,
        "governanceParticipation": 67,
        "platformEngagement": 82
      }
    },
    "trends": {
      "investmentTrend": "increasing",
      "returnsTrend": "increasing",
      "diversificationTrend": "improving",
      "riskTrend": "stable",
      "governanceTrend": "increasing",
      "recommendations": [
        {
          "type": "diversification",
          "priority": "medium",
          "title": "Consider Energy Sector Expansion",
          "description": "Your portfolio shows strong performance in energy.",
          "actionUrl": "/marketplace?category=energy"
        }
      ]
    },
    "predictiveInsights": {
      "expectedReturns12Months": 1650000,
      "recommendedInvestments": [
        "Renewable Energy Portfolio",
        "Smart City Infrastructure"
      ],
      "riskAdjustments": [
        "Consider low-risk telecommunications projects"
      ],
      "optimizationScore": 82
    }
  }
}
```

## Governance Endpoints

### GET /governance/proposals

**Purpose**: Get governance proposals across all user's projects **Auth**:
Required

```json
// Query Parameters
{
  "status": "active|passed|rejected|executed",
  "projectId": "project_uuid",
  "page": 1,
  "limit": 20
}

// Response
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": "proposal_uuid",
        "projectId": "project_uuid",
        "projectName": "Jakarta-Bandung High-Speed Rail Extension",
        "title": "Contract Upgrade Proposal",
        "description": "Upgrade smart contract to improve efficiency",
        "status": "active",
        "startTime": "2024-01-10T10:00:00Z",
        "endTime": "2024-01-17T10:00:00Z",
        "votesFor": 1250000,
        "votesAgainst": 300000,
        "totalVotes": 1550000,
        "quorum": 1000000,
        "userVotingPower": 5000,
        "hasVoted": false,
        "userVote": null,
        "priority": "high"
      }
    ],
    "governanceStats": {
      "totalProposals": 12,
      "votedProposals": 8,
      "participationRate": 66.7,
      "votingPower": 2.3,
      "governanceRewards": 25000
    }
  }
}
```

### POST /governance/proposals/:id/vote

**Purpose**: Vote on governance proposal **Auth**: Required

```json
// Request
{
  "support": true,
  "reason": "I support this upgrade for efficiency improvements"
}

// Response
{
  "success": true,
  "data": {
    "voteId": "vote_uuid",
    "proposalId": "proposal_uuid",
    "support": true,
    "votingPower": 5000,
    "transactionHash": "0x...",
    "timestamp": "2024-01-14T10:00:00Z"
  }
}
```

## Transaction & Claims Endpoints

### GET /transactions

**Purpose**: Get user's transaction history **Auth**: Required

```json
// Query Parameters
{
  "type": "investment|return|claim|governance",
  "status": "completed|pending|failed",
  "projectId": "project_uuid",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "page": 1,
  "limit": 50
}

// Response
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "transaction_uuid",
        "type": "return",
        "projectId": "project_uuid",
        "projectTitle": "Jakarta-Bandung High-Speed Rail Extension",
        "amount": 125000,
        "date": "2024-01-10T10:00:00Z",
        "status": "completed",
        "transactionId": "TXN-001234567",
        "transactionHash": "0x...",
        "description": "Monthly profit distribution",
        "feeAmount": 6250,
        "netAmount": 118750
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 50
    }
  }
}
```

### GET /claims/available

**Purpose**: Get available profit claims **Auth**: Required

```json
// Response
{
  "success": true,
  "data": {
    "totalClaimable": 280000,
    "claims": [
      {
        "id": "claim_uuid",
        "projectId": "project_uuid",
        "projectTitle": "Bali Renewable Energy Plant",
        "amount": 280000,
        "type": "profit_distribution",
        "availableDate": "2024-01-10T10:00:00Z",
        "expiryDate": "2024-02-10T10:00:00Z",
        "status": "available"
      }
    ]
  }
}
```

### POST /claims/:id/initiate

**Purpose**: Initiate profit claim **Auth**: Required

```json
// Request
{
  "bankAccount": {
    "accountNumber": "9876543210",
    "bankName": "Bank Central Asia",
    "accountName": "John Doe"
  }
}

// Response
{
  "success": true,
  "data": {
    "claimId": "claim_uuid",
    "amount": 280000,
    "status": "processing",
    "estimatedCompletion": "2024-01-16T10:00:00Z",
    "referenceNumber": "CLM-20240114-001",
    "transactionHash": "0x..."
  }
}
```

## Admin Endpoints

### GET /admin/projects

**Purpose**: Get all projects for admin oversight **Auth**: Required (Admin
role)

```json
// Response
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project_uuid",
        "title": "Jakarta-Bandung High-Speed Rail Extension",
        "spvId": "spv_uuid",
        "spvName": "PT Infrastructure Development",
        "status": "active",
        "totalValue": 15000000000,
        "raisedAmount": 2500000000,
        "investorCount": 150,
        "createdAt": "2024-01-01T10:00:00Z",
        "approvalStatus": "approved",
        "riskAssessment": "medium",
        "complianceScore": 95
      }
    ]
  }
}
```

### GET /admin/identity

**Purpose**: Get identity registry for admin management **Auth**: Required
(Admin role)

```json
// Query Parameters
{
  "verificationStatus": "verified|pending|rejected",
  "search": "email or name",
  "page": 1,
  "limit": 50
}

// Response
{
  "success": true,
  "data": {
    "identities": [
      {
        "id": "identity_uuid",
        "userId": "user_uuid",
        "email": "user@example.com",
        "verificationLevel": "advanced",
        "kycStatus": "approved",
        "claimsCount": 4,
        "identityScore": 95,
        "lastActivity": "2024-01-14T10:00:00Z",
        "investmentVolume": 11500000,
        "riskFlags": []
      }
    ],
    "stats": {
      "totalIdentities": 1250,
      "verifiedIdentities": 1180,
      "pendingVerification": 45,
      "rejectedIdentities": 25
    }
  }
}
```

### POST /admin/identity/:id/update-claims

**Purpose**: Update identity claims (admin action) **Auth**: Required (Admin
role)

```json
// Request
{
  "claims": [
    {
      "type": "KYC_APPROVED",
      "action": "add|remove|update",
      "expiryDate": "2025-01-10T10:00:00Z"
    }
  ],
  "reason": "Manual verification completed"
}

// Response
{
  "success": true,
  "data": {
    "identityId": "identity_uuid",
    "updatedClaims": 4,
    "transactionHash": "0x...",
    "timestamp": "2024-01-14T10:00:00Z"
  }
}
```

## Real-time WebSocket Events

### Connection

```
wss://api.partisipro.com/v1/ws?token=jwt_token
```

### Event Types

#### Portfolio Updates

```json
{
  "type": "portfolio_update",
  "data": {
    "projectId": "project_uuid",
    "projectName": "Jakarta-Bandung High-Speed Rail Extension",
    "updateType": "value_change|return_distribution|governance_event",
    "impact": {
      "valueChange": 125000,
      "percentageChange": 2.5,
      "newROI": 15.3
    },
    "description": "Monthly profit distribution received",
    "timestamp": "2024-01-14T10:00:00Z"
  }
}
```

#### Governance Notifications

```json
{
  "type": "governance_notification",
  "data": {
    "proposalId": "proposal_uuid",
    "projectId": "project_uuid",
    "eventType": "new_proposal|voting_deadline|proposal_executed",
    "title": "New Governance Proposal Available",
    "description": "Contract upgrade proposal requires your vote",
    "priority": "high|medium|low",
    "actionRequired": true,
    "deadline": "2024-01-17T10:00:00Z"
  }
}
```

#### Market Updates

```json
{
  "type": "market_update",
  "data": {
    "updateType": "price_change|market_trend|regulatory_news",
    "affectedProjects": ["project_uuid1", "project_uuid2"],
    "impact": "positive|negative|neutral",
    "description": "Infrastructure sector shows strong growth",
    "sourceUrl": "https://news.example.com/article"
  }
}
```

## Data Export Endpoints

### POST /export/portfolio

**Purpose**: Generate and download portfolio export **Auth**: Required

```json
// Request
{
  "format": "pdf|csv|json",
  "timeRange": "1M|3M|6M|1Y|ALL",
  "includeCharts": true,
  "includeGovernance": true,
  "includePredictions": true
}

// Response
{
  "success": true,
  "data": {
    "exportId": "export_uuid",
    "downloadUrl": "https://storage.example.com/exports/portfolio-report.pdf",
    "expiresAt": "2024-01-21T10:00:00Z",
    "fileSize": "2.5 MB",
    "status": "ready"
  }
}
```

## Error Codes

### Authentication Errors

- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Insufficient permissions
- `AUTH_004`: Account locked

### Identity Errors

- `IDENTITY_001`: Identity not verified
- `IDENTITY_002`: KYC verification required
- `IDENTITY_003`: Claims expired
- `IDENTITY_004`: Identity restricted

### Investment Errors

- `INVEST_001`: Insufficient funds
- `INVEST_002`: Project not available
- `INVEST_003`: Minimum investment not met
- `INVEST_004`: Maximum investment exceeded
- `INVEST_005`: Investment window closed

### Governance Errors

- `GOV_001`: Insufficient voting power
- `GOV_002`: Proposal not active
- `GOV_003`: Already voted
- `GOV_004`: Voting period ended

### Profiling Errors

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

### System Errors

- `SYS_001`: Database connection error
- `SYS_002`: External service unavailable
- `SYS_003`: Rate limit exceeded
- `SYS_004`: Maintenance mode

## Rate Limiting

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 1000 requests per minute
- **Admin endpoints**: 2000 requests per minute
- **Export endpoints**: 10 requests per hour

Rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642176000
```

## Webhook Endpoints (for external integrations)

### POST /webhooks/kyc-status

**Purpose**: Receive KYC status updates from providers

```json
{
  "sessionId": "kyc_session_uuid",
  "status": "approved|rejected",
  "userId": "user_uuid",
  "checks": {
    "document": "passed",
    "facial": "passed",
    "liveness": "passed",
    "aml": "passed"
  },
  "timestamp": "2024-01-14T10:00:00Z"
}
```

### POST /webhooks/payment-status

**Purpose**: Receive payment confirmation from payment gateways

```json
{
  "investmentId": "investment_uuid",
  "paymentId": "payment_provider_id",
  "status": "completed|failed",
  "amount": 5000000,
  "currency": "IDR",
  "timestamp": "2024-01-14T10:00:00Z"
}
```

This comprehensive API specification covers all frontend requirements and
provides a solid foundation for backend development and integration.
