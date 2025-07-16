# WebSocket Integration Guide

## Overview

The Partisipro frontend platform includes comprehensive real-time functionality through Socket.IO WebSocket integration. This enables live updates for portfolio changes, governance activities, KYC status, and system notifications.

## Architecture

### WebSocket Service (`websocket.service.ts`)
- Singleton service managing Socket.IO connection
- Automatic reconnection with exponential backoff
- Event subscription management
- Connection status monitoring

### React Hook (`useWebSocket.ts`)
- `useWebSocket()` - Core hook for WebSocket functionality
- `usePortfolioWebSocket()` - Specialized for portfolio updates  
- `useGovernanceWebSocket()` - Specialized for governance updates
- `useKYCWebSocket()` - Specialized for KYC status updates

## Real-time Event Types

### Portfolio Events
- `portfolio_update` - Portfolio value changes
- `investment_update` - New investments or changes
- `profit_distribution` - Profit payments available

### Governance Events  
- `governance_update` - New proposals, voting changes
- `proposal_created` - New governance proposals
- `proposal_executed` - Proposal execution results

### KYC Events
- `kyc_status_update` - KYC verification progress
- `identity_update` - Identity verification changes

### System Events
- `system_notification` - Platform announcements
- `project_update` - Project status changes

## Usage Examples

### Dashboard Integration
```typescript
import { usePortfolioWebSocket } from '@/hooks/useWebSocket';

export default function Dashboard() {
  const { portfolioData, lastUpdate, isConnected } = usePortfolioWebSocket();
  
  return (
    <div>
      <div className="status-indicator">
        Status: {isConnected ? 'Live' : 'Offline'}
      </div>
      {lastUpdate && (
        <div>Last update: {lastUpdate.toLocaleTimeString()}</div>
      )}
    </div>
  );
}
```

### Governance Integration
```typescript
import { useGovernanceWebSocket } from '@/hooks/useWebSocket';

export default function Governance() {
  const { proposals, notifications, isConnected } = useGovernanceWebSocket();
  
  useEffect(() => {
    if (notifications.length > 0) {
      // Show real-time governance notifications
      toast.info(notifications[0].message);
    }
  }, [notifications]);
}
```

### KYC Integration
```typescript
import { useKYCWebSocket } from '@/hooks/useWebSocket';

export default function KYC() {
  const { kycStatus, verificationProgress, isConnected } = useKYCWebSocket();
  
  useEffect(() => {
    if (kycStatus?.status === 'completed') {
      // Automatically move to next step
      setCurrentStep('identity');
    }
  }, [kycStatus]);
}
```

## Configuration

### Environment Variables
```bash
# WebSocket server URL
NEXT_PUBLIC_WS_URL=http://localhost:3001

# API server URL  
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Connection Options
- **Transport**: WebSocket with polling fallback
- **Timeout**: 20 seconds
- **Reconnection**: Up to 5 attempts with exponential backoff
- **Authentication**: JWT token via auth header

## Backend Requirements

The frontend expects a Socket.IO server with these namespaces:

### Authentication
- JWT token verification on connection
- User identification for targeted updates

### Event Emissions
- Server must emit events in the documented format
- Each event should include user/project context
- Proper error handling for invalid subscriptions

### Subscription Management
- `subscribe_portfolio` - Portfolio updates for user
- `subscribe_governance` - Governance updates  
- `subscribe_kyc_status` - KYC status updates
- `unsubscribe_*` - Unsubscribe from event types

## Error Handling

### Connection Failures
- Automatic reconnection attempts
- Graceful degradation to polling
- User notification of connection status

### Event Errors
- Try-catch around all event handlers
- Logging of processing errors
- Continued operation despite handler failures

### Network Issues
- Reconnection with exponential backoff
- Connection status indicators
- Offline mode support

## Security Considerations

### Authentication
- JWT token required for connection
- Token validation on server side
- Automatic disconnection for invalid tokens

### Data Validation
- All incoming events validated
- Sanitization of user data
- Rate limiting for event subscriptions

### Privacy
- User-specific event filtering
- No cross-user data exposure
- Audit logging of sensitive events

## Testing

### Development
1. Start backend server with WebSocket support
2. Use browser dev tools to monitor connections
3. Trigger events from backend to test real-time updates

### Production
- Monitor connection success rates
- Track reconnection frequency  
- Measure event delivery latency
- Alert on WebSocket failures

## Performance

### Optimization
- Debounced updates for high-frequency events
- Selective subscription to reduce bandwidth
- Connection pooling for multiple components

### Monitoring
- Connection status tracking
- Event delivery metrics
- Performance impact measurement
- Memory usage monitoring

## Troubleshooting

### Common Issues
1. **Connection Refused** - Check backend server is running
2. **Authentication Failed** - Verify JWT token validity
3. **No Events Received** - Check subscription configuration
4. **Frequent Disconnections** - Network stability issues

### Debug Tools
- Browser WebSocket inspector
- Console logging for connection events
- Network tab for failed connections
- Backend logs for authentication errors