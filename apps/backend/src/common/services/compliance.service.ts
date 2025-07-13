import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import * as crypto from 'crypto';

export interface ComplianceEvent {
  id: string;
  userId: string;
  eventType: ComplianceEventType;
  action: string;
  resource: string;
  changes?: {
    before: any;
    after: any;
  };
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  requestId?: string;
  regulations: ComplianceRegulation[];
}

export enum ComplianceEventType {
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  DATA_DELETION = 'data_deletion',
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  PERMISSION_CHANGE = 'permission_change',
  EXPORT_DATA = 'export_data',
  GDPR_REQUEST = 'gdpr_request',
  KYC_VERIFICATION = 'kyc_verification',
  FINANCIAL_TRANSACTION = 'financial_transaction',
  CONSENT_MANAGEMENT = 'consent_management',
}

export enum ComplianceRegulation {
  GDPR = 'GDPR',
  PCI_DSS = 'PCI_DSS',
  INDONESIA_DPA = 'INDONESIA_DPA',
  FATCA = 'FATCA',
  AML = 'AML',
  KYC = 'KYC',
  SOX = 'SOX',
  ISO_27001 = 'ISO_27001',
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  regulation: ComplianceRegulation;
  autoDelete: boolean;
}

export interface GDPRRequest {
  id: string;
  userId: string;
  requestType:
    | 'access'
    | 'rectification'
    | 'erasure'
    | 'portability'
    | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: Date;
  completionDate?: Date;
  reason?: string;
  data?: any;
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  private readonly dataRetentionPolicies: DataRetentionPolicy[] = [
    {
      dataType: 'audit_logs',
      retentionPeriod: 2555, // 7 years
      regulation: ComplianceRegulation.SOX,
      autoDelete: false,
    },
    {
      dataType: 'transaction_logs',
      retentionPeriod: 2555, // 7 years
      regulation: ComplianceRegulation.AML,
      autoDelete: false,
    },
    {
      dataType: 'user_activity',
      retentionPeriod: 1095, // 3 years
      regulation: ComplianceRegulation.GDPR,
      autoDelete: true,
    },
    {
      dataType: 'kyc_documents',
      retentionPeriod: 1825, // 5 years
      regulation: ComplianceRegulation.KYC,
      autoDelete: false,
    },
    {
      dataType: 'payment_data',
      retentionPeriod: 1095, // 3 years
      regulation: ComplianceRegulation.PCI_DSS,
      autoDelete: true,
    },
    {
      dataType: 'session_logs',
      retentionPeriod: 365, // 1 year
      regulation: ComplianceRegulation.GDPR,
      autoDelete: true,
    },
  ];

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService
  ) {}

  async logComplianceEvent(
    userId: string,
    eventType: ComplianceEventType,
    action: string,
    resource: string,
    ipAddress: string,
    userAgent: string,
    requestId?: string,
    changes?: { before: any; after: any },
    regulations: ComplianceRegulation[] = []
  ): Promise<void> {
    try {
      const complianceEvent: ComplianceEvent = {
        id: crypto.randomUUID(),
        userId,
        eventType,
        action,
        resource,
        changes,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        requestId,
        regulations,
      };

      // Store in Firebase with high durability
      await this.firebaseService.setDocument(
        'compliance_events',
        complianceEvent.id,
        complianceEvent
      );

      // Also store in a separate audit collection for SOX compliance
      await this.firebaseService.setDocument(
        'audit_trail',
        complianceEvent.id,
        {
          ...complianceEvent,
          auditType: 'compliance',
          immutable: true,
        }
      );

      this.logger.log(
        `Compliance event logged: ${eventType} - ${action} on ${resource} by user ${userId}`
      );
    } catch (error) {
      this.logger.error('Failed to log compliance event:', error);
      // Compliance logging failures should be escalated
      throw error;
    }
  }

  async processGDPRRequest(
    userId: string,
    requestType: GDPRRequest['requestType'],
    _userEmail: string
  ): Promise<GDPRRequest> {
    try {
      const gdprRequest: GDPRRequest = {
        id: crypto.randomUUID(),
        userId,
        requestType,
        status: 'pending',
        requestDate: new Date(),
      };

      // Store GDPR request
      await this.firebaseService.setDocument(
        'gdpr_requests',
        gdprRequest.id,
        gdprRequest
      );

      // Log compliance event
      await this.logComplianceEvent(
        userId,
        ComplianceEventType.GDPR_REQUEST,
        `GDPR ${requestType} request initiated`,
        'user_data',
        'system',
        'system',
        gdprRequest.id,
        undefined,
        [ComplianceRegulation.GDPR]
      );

      // Process the request based on type
      switch (requestType) {
        case 'access':
          await this.processDataAccessRequest(gdprRequest);
          break;
        case 'erasure':
          await this.processDataErasureRequest(gdprRequest);
          break;
        case 'portability':
          await this.processDataPortabilityRequest(gdprRequest);
          break;
        case 'rectification':
          await this.processDataRectificationRequest(gdprRequest);
          break;
        case 'objection':
          await this.processObjectionRequest(gdprRequest);
          break;
      }

      return gdprRequest;
    } catch (error) {
      this.logger.error('Failed to process GDPR request:', error);
      throw error;
    }
  }

  async generateComplianceReport(
    regulation: ComplianceRegulation,
    startDate: Date,
    endDate: Date
  ): Promise<{
    regulation: ComplianceRegulation;
    period: { start: Date; end: Date };
    totalEvents: number;
    eventsByType: Record<string, number>;
    recommendations: string[];
  }> {
    try {
      // Query compliance events for the period
      const complianceEvents = await this.firebaseService.getDocuments(
        'compliance_events',
        query =>
          query
            .where('timestamp', '>=', startDate)
            .where('timestamp', '<=', endDate)
            .where('regulations', 'array-contains', regulation)
      );

      // Aggregate data
      const events = complianceEvents.docs.map(doc => doc.data());
      const totalEvents = events.length;

      const eventsByType = events.reduce(
        (acc, event) => {
          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Generate recommendations based on the regulation
      const recommendations = this.generateComplianceRecommendations(
        regulation,
        events
      );

      return {
        regulation,
        period: { start: startDate, end: endDate },
        totalEvents,
        eventsByType,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  async checkDataRetentionCompliance(): Promise<{
    compliant: boolean;
    violations: string[];
    recommendedActions: string[];
  }> {
    try {
      const violations: string[] = [];
      const recommendedActions: string[] = [];

      for (const policy of this.dataRetentionPolicies) {
        const cutoffDate = new Date(
          Date.now() - policy.retentionPeriod * 24 * 60 * 60 * 1000
        );

        // Check for data that should be deleted
        const expiredData = await this.findExpiredData(
          policy.dataType,
          cutoffDate
        );

        if (expiredData.length > 0) {
          violations.push(
            `${expiredData.length} records of ${policy.dataType} exceed retention period (${policy.regulation})`
          );

          if (policy.autoDelete) {
            recommendedActions.push(
              `Auto-delete expired ${policy.dataType} records`
            );
          } else {
            recommendedActions.push(
              `Manual review required for expired ${policy.dataType} records`
            );
          }
        }
      }

      return {
        compliant: violations.length === 0,
        violations,
        recommendedActions,
      };
    } catch (error) {
      this.logger.error('Failed to check data retention compliance:', error);
      throw error;
    }
  }

  async anonymizeUserData(userId: string): Promise<void> {
    try {
      // Anonymize personal data while preserving audit trail
      const anonymizedData = {
        id: userId,
        email: `anonymized_${crypto.randomUUID()}@example.com`,
        firstName: 'Anonymized',
        lastName: 'User',
        phoneNumber: '+62-XXX-XXX-XXXX',
        walletAddress: '0x' + crypto.randomBytes(20).toString('hex'),
        anonymizedAt: new Date(),
        originalDataHash: crypto.randomUUID(), // For audit purposes
      };

      // Update user record
      await this.firebaseService.updateDocument('users', userId, {
        ...anonymizedData,
        isAnonymized: true,
      });

      // Log compliance event
      await this.logComplianceEvent(
        userId,
        ComplianceEventType.DATA_MODIFICATION,
        'User data anonymized',
        'user_profile',
        'system',
        'system',
        undefined,
        undefined,
        [ComplianceRegulation.GDPR]
      );

      this.logger.log(`User data anonymized: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to anonymize user data:', error);
      throw error;
    }
  }

  async validatePCIDSSCompliance(paymentData: any): Promise<{
    compliant: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for PAN (Primary Account Number) exposure
    if (this.containsFullPAN(paymentData)) {
      violations.push('Full PAN detected in payment data');
      recommendations.push('Mask PAN data, showing only last 4 digits');
    }

    // Check for CVV storage
    if (this.containsCVV(paymentData)) {
      violations.push('CVV data detected in storage');
      recommendations.push('Remove CVV data immediately - never store CVV');
    }

    // Check for track data
    if (this.containsTrackData(paymentData)) {
      violations.push('Magnetic stripe track data detected');
      recommendations.push(
        'Remove track data - never store after authorization'
      );
    }

    return {
      compliant: violations.length === 0,
      violations,
      recommendations,
    };
  }

  private async processDataAccessRequest(
    gdprRequest: GDPRRequest
  ): Promise<void> {
    try {
      // Collect all user data
      const userData = await this.collectUserData(gdprRequest.userId);

      // Update request with collected data
      await this.firebaseService.updateDocument(
        'gdpr_requests',
        gdprRequest.id,
        {
          status: 'completed',
          completionDate: new Date(),
          data: userData,
        }
      );

      this.logger.log(`GDPR data access request completed: ${gdprRequest.id}`);
    } catch (error) {
      this.logger.error('Failed to process data access request:', error);
      throw error;
    }
  }

  private async processDataErasureRequest(
    gdprRequest: GDPRRequest
  ): Promise<void> {
    try {
      // Anonymize user data instead of deletion (for audit trail)
      await this.anonymizeUserData(gdprRequest.userId);

      // Update request status
      await this.firebaseService.updateDocument(
        'gdpr_requests',
        gdprRequest.id,
        {
          status: 'completed',
          completionDate: new Date(),
        }
      );

      this.logger.log(`GDPR data erasure request completed: ${gdprRequest.id}`);
    } catch (error) {
      this.logger.error('Failed to process data erasure request:', error);
      throw error;
    }
  }

  private async processDataPortabilityRequest(
    gdprRequest: GDPRRequest
  ): Promise<void> {
    try {
      // Export user data in portable format
      const exportData = await this.exportUserData(gdprRequest.userId);

      // Update request with export data
      await this.firebaseService.updateDocument(
        'gdpr_requests',
        gdprRequest.id,
        {
          status: 'completed',
          completionDate: new Date(),
          data: exportData,
        }
      );

      this.logger.log(
        `GDPR data portability request completed: ${gdprRequest.id}`
      );
    } catch (error) {
      this.logger.error('Failed to process data portability request:', error);
      throw error;
    }
  }

  private async processDataRectificationRequest(
    gdprRequest: GDPRRequest
  ): Promise<void> {
    // This would require additional input from the user
    // For now, mark as pending manual review
    await this.firebaseService.updateDocument('gdpr_requests', gdprRequest.id, {
      status: 'pending',
      reason: 'Manual review required for data rectification',
    });
  }

  private async processObjectionRequest(
    gdprRequest: GDPRRequest
  ): Promise<void> {
    // This would require additional input from the user
    // For now, mark as pending manual review
    await this.firebaseService.updateDocument('gdpr_requests', gdprRequest.id, {
      status: 'pending',
      reason: 'Manual review required for objection processing',
    });
  }

  private async collectUserData(userId: string): Promise<any> {
    try {
      const data = {
        profile: await this.firebaseService.getDocument('users', userId),
        sessions: await this.firebaseService.getDocuments(
          `users/${userId}/sessions`
        ),
        investments: await this.firebaseService.getDocuments(
          'investments',
          query => query.where('userId', '==', userId)
        ),
        transactions: await this.firebaseService.getDocuments(
          'transactions',
          query => query.where('userId', '==', userId)
        ),
        kycData: await this.firebaseService.getDocument(
          `users/${userId}/kyc`,
          'data'
        ),
        complianceEvents: await this.firebaseService.getDocuments(
          'compliance_events',
          query => query.where('userId', '==', userId)
        ),
      };

      return data;
    } catch (error) {
      this.logger.error('Failed to collect user data:', error);
      throw error;
    }
  }

  private async exportUserData(userId: string): Promise<any> {
    const userData = await this.collectUserData(userId);

    // Format for export (JSON)
    return {
      exportDate: new Date(),
      format: 'JSON',
      data: userData,
    };
  }

  private async findExpiredData(
    dataType: string,
    cutoffDate: Date
  ): Promise<any[]> {
    try {
      const collection = this.getCollectionForDataType(dataType);
      const expiredData = await this.firebaseService.getDocumentsByQuery(
        collection,
        'timestamp',
        '<',
        cutoffDate
      );

      return expiredData.docs.map(doc => doc.data());
    } catch (error) {
      this.logger.error(`Failed to find expired data for ${dataType}:`, error);
      return [];
    }
  }

  private getCollectionForDataType(dataType: string): string {
    const mapping = {
      audit_logs: 'audit_trail',
      transaction_logs: 'transactions',
      user_activity: 'user_activities',
      kyc_documents: 'kyc_documents',
      payment_data: 'payment_records',
      session_logs: 'sessions',
    };

    return mapping[dataType] || dataType;
  }

  private generateComplianceRecommendations(
    regulation: ComplianceRegulation,
    events: any[]
  ): string[] {
    const recommendations: string[] = [];

    switch (regulation) {
      case ComplianceRegulation.GDPR:
        if (events.filter(e => e.eventType === 'data_access').length > 1000) {
          recommendations.push(
            'High volume of data access events - consider implementing additional access controls'
          );
        }
        break;
      case ComplianceRegulation.PCI_DSS:
        if (
          events.filter(e => e.eventType === 'sensitive_data_access').length >
          500
        ) {
          recommendations.push(
            'High volume of sensitive data access - review access patterns'
          );
        }
        break;
      case ComplianceRegulation.SOX:
        if (
          events.filter(e => e.eventType === 'financial_transaction').length >
          10000
        ) {
          recommendations.push(
            'High volume of financial transactions - ensure proper segregation of duties'
          );
        }
        break;
    }

    return recommendations;
  }

  private containsFullPAN(data: any): boolean {
    const panPattern =
      /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/;
    return panPattern.test(JSON.stringify(data));
  }

  private containsCVV(data: any): boolean {
    // const cvvPattern = /\b[0-9]{3,4}\b/;
    const dataStr = JSON.stringify(data);
    return (
      dataStr.includes('cvv') ||
      dataStr.includes('cvc') ||
      dataStr.includes('security_code')
    );
  }

  private containsTrackData(data: any): boolean {
    const trackPattern = /[%+].*[=?]/;
    return trackPattern.test(JSON.stringify(data));
  }
}
