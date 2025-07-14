# Integration Architecture & Deployment Specifications

## Overview

This document defines the complete integration architecture for the Partisipro
platform, covering frontend-backend integration patterns, blockchain
interactions, external service integrations, and production deployment
specifications.

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Blockchain    │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (Arbitrum)    │
│                 │    │                 │    │                 │
│ • React/TS      │    │ • PostgreSQL    │    │ • ERC-3643      │
│ • Tailwind      │    │ • Redis Cache   │    │ • Smart         │
│ • Wagmi/Viem    │    │ • WebSocket     │    │   Contracts     │
│ • Zustand       │    │ • Queue System  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│ External Services│◄─────────────┘
                        │                 │
                        │ • KYC Providers │
                        │ • Payment Gates │
                        │ • Email Service │
                        │ • File Storage  │
                        │ • Monitoring    │
                        └─────────────────┘
```

### Technology Stack

#### Frontend Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for app state, React Hook Form + Zod for forms
- **Web3 Integration**: Wagmi v1 + Viem for blockchain interactions
- **UI Components**: Radix UI primitives with custom styling
- **Development**: ESLint, Prettier, Husky for code quality

#### Backend Stack (Requirements)

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL 14+ with TypeORM
- **Cache**: Redis 7+ for session and data caching
- **Queue**: Bull Queue with Redis for background jobs
- **Real-time**: WebSocket server for live updates
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 or compatible object storage

#### Blockchain Stack

- **Network**: Arbitrum One (mainnet), Arbitrum Sepolia (testnet)
- **Standards**: ERC-3643 for identity, ERC-20 for tokens
- **Interaction**: Ethers.js/Viem for contract interactions
- **Gas Optimization**: Multicall and batch operations
- **Monitoring**: The Graph for event indexing

#### External Integrations

- **KYC Providers**: Verihubs, Sum&Substance, Jumio
- **Payment Gateways**: Indonesian payment processors
- **Email Service**: SendGrid or AWS SES
- **Monitoring**: DataDog, Sentry for error tracking

## Data Flow Architecture

### 1. User Authentication Flow

```
Frontend ──► Backend ──► Database ──► JWT ──► Frontend
    │                                            │
    └──► Store in Zustand ──► Persist in localStorage
```

**Implementation Pattern**:

```typescript
// Frontend: Auth store with Zustand
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Backend: JWT strategy with refresh tokens
@Injectable()
export class AuthService {
  async signIn(credentials: LoginDto): Promise<AuthResponse> {
    // Validate credentials, generate JWT + refresh token
    // Store refresh token in Redis with expiration
    // Return user data + tokens
  }
}
```

### 2. Identity Verification Flow

```
Frontend ──► Backend ──► KYC Provider ──► Webhook ──► Backend ──► Blockchain
    │                                                      │            │
    │                                                      ▼            ▼
    └──► Real-time Status ◄── WebSocket ◄── Event Handler ◄── Claims ── Identity Registry
```

**Implementation Pattern**:

```typescript
// Frontend: Real-time KYC status tracking
export function useKYCStatus(sessionId: string) {
  const [status, setStatus] = useState<KYCStatus>();

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/kyc-status?session=${sessionId}`);
    ws.onmessage = event => {
      setStatus(JSON.parse(event.data));
    };
    return () => ws.close();
  }, [sessionId]);

  return status;
}

// Backend: KYC webhook handler with blockchain integration
@Controller('webhooks')
export class WebhookController {
  @Post('kyc-status')
  async handleKYCUpdate(@Body() payload: KYCWebhookPayload) {
    // Update database status
    // If approved, issue claims to blockchain
    // Emit WebSocket event to frontend
    // Send notification to user
  }
}
```

### 3. Investment Flow

```
Frontend ──► Backend ──► Payment Gateway ──► Blockchain ──► Event Indexing
    │           │               │                 │              │
    │           ▼               ▼                 ▼              ▼
    └─── WebSocket ◄─ Queue ◄─ Webhook ◄─ Token Mint ──► Database Update
```

**Implementation Pattern**:

```typescript
// Frontend: Investment with real-time tracking
export function useInvestmentFlow() {
  const [status, setStatus] = useState<InvestmentStatus>();

  const invest = async (amount: number, projectId: string) => {
    // 1. Submit investment request
    const response = await api.post(`/projects/${projectId}/invest`, {
      amount,
    });

    // 2. Track payment status via WebSocket
    const ws = new WebSocket(`${WS_URL}/investment-status`);
    ws.onmessage = event => setStatus(JSON.parse(event.data));

    return response.data;
  };

  return { invest, status };
}

// Backend: Investment processing with queue system
@Injectable()
export class InvestmentService {
  async processInvestment(investmentData: CreateInvestmentDto) {
    // 1. Create investment record
    const investment = await this.create(investmentData);

    // 2. Generate payment instructions
    const paymentInstructions =
      await this.paymentService.createPayment(investment);

    // 3. Queue blockchain operations for after payment
    await this.queueService.add('process-token-minting', {
      investmentId: investment.id,
      delay: '15m', // Wait for payment confirmation
    });

    return { investment, paymentInstructions };
  }
}
```

### 4. Portfolio Analytics Flow

```
Frontend ──► Backend ──► Database Query ──► Analytics Engine ──► Cache
    │           │              │                    │              │
    │           ▼              ▼                    ▼              ▼
    └─── Real-time ◄── WebSocket ◄── Event Stream ◄── Blockchain ◄── Redis
```

## Integration Patterns

### 1. API Integration Pattern

**Centralized API Client**:

```typescript
// Frontend: Type-safe API client with automatic error handling
class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error.code,
        data.error.message,
        data.error.details
      );
    }

    return data;
  }

  // Type-safe method generation
  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  post<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  // ... other methods
}

// Usage with React Query for caching and state management
export function useProjects(filters: ProjectFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => apiClient.get<ProjectsResponse>('/projects'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### 2. Blockchain Integration Pattern

**Smart Contract Interaction Layer**:

```typescript
// Frontend: Contract interaction with error handling and gas optimization
export class ContractService {
  private provider: Provider;
  private signer: Signer;

  constructor(provider: Provider, signer: Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  async executeTransaction(
    contract: Contract,
    method: string,
    params: any[],
    options: TransactionOptions = {}
  ): Promise<TransactionResponse> {
    try {
      // 1. Estimate gas with buffer
      const gasEstimate = await contract.estimateGas[method](...params);
      const gasLimit = gasEstimate.mul(120).div(100); // 20% buffer

      // 2. Get current gas price
      const gasPrice = await this.provider.getGasPrice();

      // 3. Execute transaction
      const tx = await contract[method](...params, {
        gasLimit,
        gasPrice,
        ...options,
      });

      // 4. Store transaction for tracking
      await this.storeTransaction(tx.hash, method, params);

      return tx;
    } catch (error) {
      throw new ContractError(this.parseContractError(error));
    }
  }

  async waitForConfirmation(
    txHash: string,
    confirmations: number = 1
  ): Promise<TransactionReceipt> {
    const receipt = await this.provider.waitForTransaction(
      txHash,
      confirmations
    );

    if (receipt.status === 0) {
      throw new TransactionFailedError(txHash);
    }

    return receipt;
  }
}

// Contract instances with type safety
export const getProjectTokenContract = (address: string, signer: Signer) => {
  return new Contract(
    address,
    PROJECT_TOKEN_ABI,
    signer
  ) as ProjectTokenContract;
};
```

### 3. Real-time Updates Pattern

**WebSocket Integration with State Management**:

```typescript
// Frontend: WebSocket service with automatic reconnection
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers = new Map<string, Function[]>();

  connect(token: string) {
    this.ws = new WebSocket(`${WS_URL}?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = event => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      this.handleReconnect();
    };

    this.ws.onerror = error => {
      console.error('WebSocket error:', error);
    };
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }

  subscribe(eventType: string, handler: Function) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(
        () => this.connect(this.token),
        Math.pow(2, this.reconnectAttempts) * 1000
      );
    }
  }
}

// Integration with Zustand store
export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolio: null,
  updates: [],

  connectWebSocket: (token: string) => {
    wsService.connect(token);

    wsService.subscribe('portfolio_update', (data: PortfolioUpdate) => {
      set(state => ({
        updates: [data, ...state.updates.slice(0, 49)], // Keep last 50 updates
      }));

      // Update portfolio if needed
      if (data.projectId) {
        get().refreshPortfolio();
      }
    });
  },
}));
```

### 4. Error Handling Pattern

**Centralized Error Management**:

```typescript
// Frontend: Error boundary with context-aware error handling
export class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ContractError extends Error {
  constructor(
    public reason: string,
    public method?: string,
    public params?: any[]
  ) {
    super(reason);
    this.name = 'ContractError';
  }
}

// Global error handler
export function handleError(error: unknown, context: string) {
  if (error instanceof APIError) {
    // Log to monitoring service
    logger.error('API Error', {
      code: error.code,
      context,
      details: error.details,
    });

    // Show user-friendly message
    toast.error(getErrorMessage(error.code));

    // Handle specific error codes
    if (error.code === 'AUTH_002') {
      // Token expired, redirect to login
      router.push('/auth');
    }
  } else if (error instanceof ContractError) {
    logger.error('Contract Error', {
      reason: error.reason,
      method: error.method,
      context,
    });
    toast.error('Transaction failed. Please try again.');
  } else {
    logger.error('Unknown Error', { error, context });
    toast.error('An unexpected error occurred. Please try again.');
  }
}

// Error mapping for user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_001: 'Invalid email or password. Please try again.',
  AUTH_002: 'Your session has expired. Please log in again.',
  IDENTITY_001: 'Please complete identity verification to continue.',
  INVEST_001: 'Insufficient funds for this investment.',
  INVEST_003: 'Investment amount is below the minimum requirement.',
  // ... more mappings
};
```

## Security Architecture

### 1. Authentication & Authorization

**Multi-layered Security**:

```typescript
// Frontend: Secure token management
export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  static setTokens(accessToken: string, refreshToken: string) {
    // Store access token in memory (more secure)
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);

    // Store refresh token in httpOnly cookie (most secure)
    // This should be set by the backend in Set-Cookie header
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static async refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken });
      this.setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data.accessToken;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  static clearTokens() {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

// Automatic token refresh interceptor
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const newToken = await TokenManager.refreshAccessToken();
      if (newToken) {
        // Retry original request with new token
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(error.config);
      } else {
        // Redirect to login
        router.push('/auth');
      }
    }
    return Promise.reject(error);
  }
);
```

### 2. Data Validation & Sanitization

**Input Validation Pipeline**:

```typescript
// Frontend: Form validation with Zod
export const investmentFormSchema = z.object({
  amount: z.number()
    .min(100000, 'Minimum investment is 100,000 IDR')
    .max(1000000000, 'Maximum investment is 1 billion IDR'),
  paymentMethod: z.enum(['bank_transfer', 'digital_wallet']),
  acceptRisks: z.boolean().refine(val => val === true, 'Must accept risks'),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms')
});

// Form component with validation
export function InvestmentForm({ projectId }: { projectId: string }) {
  const form = useForm({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: {
      amount: 1000000,
      paymentMethod: 'bank_transfer' as const,
      acceptRisks: false,
      acceptTerms: false
    }
  });

  const onSubmit = async (data: z.infer<typeof investmentFormSchema>) => {
    try {
      await apiClient.post(`/projects/${projectId}/invest`, data);
      toast.success('Investment submitted successfully!');
    } catch (error) {
      handleError(error, 'investment_submission');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields with validation */}
    </form>
  );
}
```

### 3. Content Security Policy

**CSP Configuration**:

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https: blob:;
      connect-src 'self' https://api.partisipro.com wss://api.partisipro.com https://*.arbitrum.io;
      frame-src 'self' https://verify.verihubs.com https://sumsub.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `
      .replace(/\s{2,}/g, ' ')
      .trim(),
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## Performance Optimization

### 1. Frontend Performance

**Code Splitting and Lazy Loading**:

```typescript
// Route-based code splitting
const Dashboard = lazy(() => import('@/app/dashboard/page'));
const Projects = lazy(() => import('@/app/marketplace/page'));
const Investment = lazy(() => import('@/app/invest/[id]/page'));

// Component-based code splitting
const PortfolioChart = lazy(() => import('@/components/ui/charts/PortfolioChart'));

// Preloading critical routes
export function preloadRoute(route: string) {
  const routeModule = import(`@/app${route}/page`);
  return routeModule;
}

// Usage in navigation
<Link
  href="/dashboard"
  onMouseEnter={() => preloadRoute('/dashboard')}
>
  Dashboard
</Link>
```

**Data Fetching Optimization**:

```typescript
// React Query with smart caching
export function useProjectsQuery(filters: ProjectFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () =>
      apiClient.get<ProjectsResponse>('/projects', { params: filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true, // For pagination
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof APIError && error.code.startsWith('AUTH_')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Prefetching for better UX
export function useProjectPrefetch() {
  const queryClient = useQueryClient();

  const prefetchProject = useCallback(
    (projectId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['project', projectId],
        queryFn: () => apiClient.get<Project>(`/projects/${projectId}`),
        staleTime: 10 * 60 * 1000,
      });
    },
    [queryClient]
  );

  return { prefetchProject };
}
```

### 2. Image and Asset Optimization

**Next.js Image Optimization**:

```typescript
// Optimized image component
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      onLoad={(e) => {
        // Track image load time for performance monitoring
        performance.mark('image-loaded');
      }}
    />
  );
}

// Progressive loading for galleries
export function ProgressiveImageGallery({ images }: { images: string[] }) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Preload visible images
    images.slice(0, 3).forEach((src, index) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(index));
      };
      img.src = src;
    });
  }, [images]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((src, index) => (
        <div key={index} className="relative aspect-square">
          {loadedImages.has(index) ? (
            <OptimizedImage src={src} alt={`Gallery image ${index + 1}`} fill />
          ) : (
            <Skeleton className="w-full h-full" />
          )}
        </div>
      ))}
    </div>
  );
}
```

## Deployment Specifications

### 1. Development Environment

**Local Development Setup**:

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - '3000:3000'
    volumes:
      - ./apps/frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
      - NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
    depends_on:
      - backend

  backend:
    image: nestjs-backend:dev
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/partisipro_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=partisipro_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Environment Variables**:

```bash
# .env.local (frontend)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ENVIRONMENT=development

# .env (backend)
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/partisipro_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=your_private_key_here
KYC_VERIHUBS_API_KEY=your_verihubs_key
KYC_SUMSUB_API_KEY=your_sumsub_key
SENDGRID_API_KEY=your_sendgrid_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=partisipro-dev-storage
```

### 2. Staging Environment

**Infrastructure as Code (Terraform)**:

```hcl
# infrastructure/staging/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-southeast-1"
}

# VPC and Networking
resource "aws_vpc" "partisipro_staging" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "partisipro-staging-vpc"
    Environment = "staging"
  }
}

# Public Subnets for Load Balancer
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.partisipro_staging.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "partisipro-staging-public-${count.index + 1}"
    Environment = "staging"
  }
}

# Private Subnets for Application
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.partisipro_staging.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "partisipro-staging-private-${count.index + 1}"
    Environment = "staging"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "partisipro_staging" {
  name = "partisipro-staging"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = "staging"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier = "partisipro-staging-db"

  engine         = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "partisipro_staging"
  username = "postgres"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.postgres.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true

  tags = {
    Environment = "staging"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "redis" {
  name       = "partisipro-staging-redis"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "partisipro-staging-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]

  tags = {
    Environment = "staging"
  }
}
```

**ECS Task Definitions**:

```json
{
  "family": "partisipro-frontend-staging",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "partisipro/frontend:staging",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "https://api-staging.partisipro.com/api/v1"
        }
      ],
      "secrets": [
        {
          "name": "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID",
          "valueFrom": "arn:aws:ssm:region:account:parameter/partisipro/staging/walletconnect_project_id"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/partisipro-frontend-staging",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/api/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 3. Production Environment

**Multi-AZ Production Setup**:

```yaml
# kubernetes/production/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: partisipro-production
  labels:
    environment: production
---
# kubernetes/production/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: partisipro-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: partisipro/frontend:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: 'production'
            - name: NEXT_PUBLIC_API_URL
              value: 'https://api.partisipro.com/api/v1'
            - name: NEXT_PUBLIC_WS_URL
              value: 'wss://api.partisipro.com/ws'
          envFrom:
            - secretRef:
                name: frontend-secrets
          resources:
            requests:
              memory: '256Mi'
              cpu: '100m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 60
            periodSeconds: 30
---
# kubernetes/production/frontend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: partisipro-production
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
---
# kubernetes/production/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: partisipro-ingress
  namespace: partisipro-production
  annotations:
    kubernetes.io/ingress.class: 'nginx'
    cert-manager.io/cluster-issuer: 'letsencrypt-prod'
    nginx.ingress.kubernetes.io/rate-limit: '100'
    nginx.ingress.kubernetes.io/rate-limit-window: '1m'
spec:
  tls:
    - hosts:
        - partisipro.com
        - www.partisipro.com
      secretName: partisipro-tls
  rules:
    - host: partisipro.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
    - host: www.partisipro.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

## Monitoring & Observability

### 1. Application Performance Monitoring

**Frontend Monitoring Setup**:

```typescript
// Frontend: Performance monitoring with Sentry and custom metrics
import * as Sentry from "@sentry/nextjs";
import { Analytics } from '@vercel/analytics/react';

// Sentry configuration
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('wallet')) {
        return null; // Don't send wallet-related errors
      }
    }
    return event;
  }
});

// Custom performance tracking
export class PerformanceTracker {
  static startTimer(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;

      // Send to monitoring service
      Sentry.addBreadcrumb({
        message: `Performance: ${label}`,
        level: 'info',
        data: { duration }
      });

      // Track in analytics
      if (duration > 1000) {
        console.warn(`Slow operation: ${label} took ${duration}ms`);
      }
    };
  }

  static trackPageLoad(pageName: string) {
    // Track Core Web Vitals
    if ('web-vital' in window) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          Sentry.setContext('web-vitals', {
            name: entry.name,
            value: entry.value,
            page: pageName
          });
        }
      }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    }
  }
}

// Usage in components
export function InvestmentPage({ projectId }: { projectId: string }) {
  useEffect(() => {
    PerformanceTracker.trackPageLoad('investment');
  }, []);

  const handleInvestment = async (amount: number) => {
    const endTimer = PerformanceTracker.startTimer('investment_flow');

    try {
      await apiClient.post(`/projects/${projectId}/invest`, { amount });
      endTimer();
    } catch (error) {
      endTimer();
      Sentry.captureException(error, {
        tags: { feature: 'investment' },
        extra: { projectId, amount }
      });
      throw error;
    }
  };

  return (
    <div>
      <Analytics />
      {/* Component JSX */}
    </div>
  );
}
```

### 2. Business Metrics Tracking

**Analytics and KPI Tracking**:

```typescript
// Frontend: Business metrics tracking
export class BusinessMetrics {
  static trackConversion(
    event: string,
    value?: number,
    metadata?: Record<string, any>
  ) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', event, {
        value,
        currency: 'IDR',
        ...metadata,
      });
    }

    // Custom analytics
    apiClient.post('/analytics/events', {
      event,
      value,
      metadata,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      userId: getCurrentUserId(),
    });
  }

  static trackInvestmentFunnel(
    step: string,
    projectId: string,
    amount?: number
  ) {
    this.trackConversion('investment_funnel', amount, {
      funnel_step: step,
      project_id: projectId,
    });
  }

  static trackKYCCompletion(provider: string, duration: number) {
    this.trackConversion('kyc_completed', duration, {
      provider,
      verification_type: 'individual',
    });
  }

  static trackGovernanceParticipation(action: string, proposalId: string) {
    this.trackConversion('governance_action', undefined, {
      action,
      proposal_id: proposalId,
    });
  }
}

// Usage throughout the app
export function useAnalytics() {
  const trackEvent = useCallback(
    (event: string, metadata?: Record<string, any>) => {
      BusinessMetrics.trackConversion(event, undefined, metadata);
    },
    []
  );

  return { trackEvent };
}
```

### 3. Health Checks and Monitoring

**Comprehensive Health Monitoring**:

```typescript
// Frontend: Health check API
export async function GET() {
  const checks = await Promise.allSettled([
    // Check API connectivity
    fetch(process.env.NEXT_PUBLIC_API_URL + '/health'),

    // Check external services
    fetch('https://arbitrum-sepolia.infura.io/v3/' + process.env.INFURA_KEY),

    // Check critical environment variables
    Promise.resolve(!!process.env.NEXT_PUBLIC_API_URL),
  ]);

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    checks: {
      api: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      blockchain: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      config: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy',
    },
  };

  const overallStatus = Object.values(health.checks).every(
    check => check === 'healthy'
  )
    ? 'healthy'
    : 'unhealthy';

  return Response.json(
    { ...health, status: overallStatus },
    { status: overallStatus === 'healthy' ? 200 : 503 }
  );
}

// Uptime monitoring with Datadog
export function setupUptimeMonitoring() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Synthetic monitoring
    setInterval(async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          console.error('Health check failed:', response.status);
        }
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, 60000); // Every minute
  }
}
```

## Disaster Recovery & Backup

### 1. Data Backup Strategy

**Automated Backup System**:

```yaml
# kubernetes/backup/database-backup.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: partisipro-production
spec:
  schedule: '0 2 * * *' # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:14
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: postgres-secret
                      key: password
              command:
                - /bin/bash
                - -c
                - |
                  pg_dump -h postgres-service -U postgres partisipro_production | \
                  gzip > /backup/db-backup-$(date +%Y%m%d-%H%M%S).sql.gz

                  # Upload to S3
                  aws s3 cp /backup/db-backup-$(date +%Y%m%d-%H%M%S).sql.gz \
                    s3://partisipro-backups/database/

                  # Clean up local file
                  rm /backup/db-backup-$(date +%Y%m%d-%H%M%S).sql.gz

                  # Keep only last 30 days of backups
                  aws s3 ls s3://partisipro-backups/database/ | \
                  head -n -30 | awk '{print $4}' | \
                  xargs -I {} aws s3 rm s3://partisipro-backups/database/{}
              volumeMounts:
                - name: backup-storage
                  mountPath: /backup
          volumes:
            - name: backup-storage
              emptyDir: {}
          restartPolicy: OnFailure
```

### 2. Disaster Recovery Plan

**Recovery Procedures**:

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

# Disaster Recovery Script for Partisipro Platform

set -e

ENVIRONMENT=${1:-production}
BACKUP_DATE=${2:-latest}

echo "Starting disaster recovery for environment: $ENVIRONMENT"

# 1. Restore Database
echo "Restoring database..."
if [ "$BACKUP_DATE" = "latest" ]; then
  BACKUP_FILE=$(aws s3 ls s3://partisipro-backups/database/ | sort | tail -n 1 | awk '{print $4}')
else
  BACKUP_FILE="db-backup-${BACKUP_DATE}.sql.gz"
fi

aws s3 cp s3://partisipro-backups/database/$BACKUP_FILE /tmp/restore.sql.gz
gunzip /tmp/restore.sql.gz

# Create new database instance if needed
kubectl apply -f kubernetes/${ENVIRONMENT}/postgres.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n partisipro-${ENVIRONMENT} --timeout=300s

# Restore data
kubectl exec -n partisipro-${ENVIRONMENT} deployment/postgres -- \
  psql -U postgres -d partisipro_${ENVIRONMENT} < /tmp/restore.sql

# 2. Restore Application State
echo "Restoring application deployments..."
kubectl apply -f kubernetes/${ENVIRONMENT}/

# Wait for all services to be ready
kubectl wait --for=condition=available deployment --all -n partisipro-${ENVIRONMENT} --timeout=600s

# 3. Verify System Health
echo "Verifying system health..."
sleep 30

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://partisipro.com/api/health)
if [ "$HEALTH_CHECK" = "200" ]; then
  echo "✅ System recovery completed successfully"
else
  echo "❌ System health check failed"
  exit 1
fi

# 4. Notify team
echo "Sending recovery notification..."
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-type: application/json' \
  --data '{"text":"🚀 Partisipro disaster recovery completed successfully for environment: '${ENVIRONMENT}'"}'

echo "Disaster recovery completed!"
```

This comprehensive integration architecture provides a solid foundation for
production deployment and long-term maintenance of the Partisipro platform,
ensuring scalability, security, and reliability.
