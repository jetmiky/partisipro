import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  SubmitSpvApplicationDto,
  ReviewSpvApplicationDto,
  UpdateSpvApplicationDto,
} from './dto';

export interface SPVApplication {
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

export interface ApprovedSPV {
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

export interface SPVStats {
  pendingApplications: number;
  approvedSPVs: number;
  totalProjectsCreated: number;
  totalFundingFacilitated: number;
}

@Injectable()
export class SpvApplicationsService {
  private readonly logger = new Logger(SpvApplicationsService.name);
  private readonly APPLICATIONS_COLLECTION = 'spv_applications';
  private readonly APPROVED_SPVS_COLLECTION = 'approved_spvs';

  constructor(
    private firebaseService: FirebaseService,
    private notificationsService: NotificationsService
  ) {}

  /**
   * Submit a new SPV application
   */
  async submitApplication(
    userId: string,
    submitDto: SubmitSpvApplicationDto
  ): Promise<SPVApplication> {
    this.logger.log(`Submitting SPV application for user: ${userId}`);

    // Check if user already has a pending or approved application
    const existingApplication = await this.findExistingApplication(userId);
    if (existingApplication) {
      throw new BadRequestException(
        'You already have an existing SPV application. Only one application per user is allowed.'
      );
    }

    // Validate wallet threshold
    if (submitDto.threshold > submitDto.signers.length) {
      throw new BadRequestException(
        'Signature threshold cannot exceed the number of signers'
      );
    }

    // Generate application ID
    const applicationId = `spv_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create application object
    const application: SPVApplication = {
      id: applicationId,
      userId,
      ...submitDto,
      status: 'pending',
      submittedDate: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    await this.firebaseService.setDocument(
      this.APPLICATIONS_COLLECTION,
      applicationId,
      application
    );

    // Send notification to admins about new application
    await this.notifyAdminsNewApplication(application);

    // Send confirmation email to applicant
    await this.sendApplicationConfirmation(application);

    this.logger.log(`SPV application submitted successfully: ${applicationId}`);
    return application;
  }

  /**
   * Get all SPV applications with optional filtering
   */
  async getApplications(
    status?: 'pending' | 'under_review' | 'approved' | 'rejected',
    limit: number = 50,
    startAfter?: string
  ): Promise<{ applications: SPVApplication[]; hasMore: boolean }> {
    this.logger.log(
      `Fetching SPV applications with status: ${status || 'all'}`
    );

    const docs = await this.firebaseService.getDocuments(
      this.APPLICATIONS_COLLECTION,
      ref => {
        let queryRef = ref;
        if (status) {
          queryRef = queryRef.where('status', '==', status);
        }
        queryRef = queryRef.orderBy('submittedDate', 'desc').limit(limit + 1);
        if (startAfter) {
          queryRef = queryRef.startAfter(startAfter);
        }
        return queryRef;
      }
    );

    const applications = docs.docs
      .slice(0, limit)
      .map(doc => doc.data() as SPVApplication);
    const hasMore = docs.docs.length > limit;

    return { applications, hasMore };
  }

  /**
   * Get SPV application by ID
   */
  async getApplicationById(applicationId: string): Promise<SPVApplication> {
    const doc = await this.firebaseService.getDocument(
      this.APPLICATIONS_COLLECTION,
      applicationId
    );

    if (!doc.exists) {
      throw new NotFoundException('SPV application not found');
    }

    return doc.data() as SPVApplication;
  }

  /**
   * Get SPV application by user ID
   */
  async getApplicationByUserId(userId: string): Promise<SPVApplication | null> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.APPLICATIONS_COLLECTION,
      'userId',
      userId
    );

    if (docs.docs.length === 0) {
      return null;
    }

    // Return the most recent application
    const applications = docs.docs
      .map(doc => doc.data() as SPVApplication)
      .sort(
        (a, b) =>
          new Date(b.submittedDate).getTime() -
          new Date(a.submittedDate).getTime()
      );

    return applications[0];
  }

  /**
   * Update SPV application (only for pending applications)
   */
  async updateApplication(
    applicationId: string,
    userId: string,
    updateDto: UpdateSpvApplicationDto
  ): Promise<SPVApplication> {
    const application = await this.getApplicationById(applicationId);

    // Check ownership
    if (application.userId !== userId) {
      throw new ForbiddenException('You can only update your own application');
    }

    // Check if application can be updated
    if (application.status !== 'pending') {
      throw new BadRequestException('Only pending applications can be updated');
    }

    // Validate wallet threshold if provided
    if (updateDto.threshold && updateDto.signers) {
      if (updateDto.threshold > updateDto.signers.length) {
        throw new BadRequestException(
          'Signature threshold cannot exceed the number of signers'
        );
      }
    }

    // Update application
    const updatedApplication: SPVApplication = {
      ...application,
      ...updateDto,
      updatedAt: new Date(),
    };

    await this.firebaseService.updateDocument(
      this.APPLICATIONS_COLLECTION,
      applicationId,
      updatedApplication
    );

    this.logger.log(`SPV application updated: ${applicationId}`);
    return updatedApplication;
  }

  /**
   * Review SPV application (admin only)
   */
  async reviewApplication(
    reviewDto: ReviewSpvApplicationDto,
    reviewerId: string
  ): Promise<SPVApplication> {
    this.logger.log(
      `Reviewing SPV application: ${reviewDto.applicationId} - Action: ${reviewDto.action}`
    );

    const application = await this.getApplicationById(reviewDto.applicationId);

    // Check if application can be reviewed
    if (
      application.status === 'approved' ||
      application.status === 'rejected'
    ) {
      throw new BadRequestException(
        `Application has already been ${application.status}`
      );
    }

    // Update application status
    const reviewedApplication: SPVApplication = {
      ...application,
      status: reviewDto.action === 'approve' ? 'approved' : 'rejected',
      reviewedDate: new Date().toISOString(),
      reviewedBy: reviewerId,
      reviewNotes: reviewDto.reviewNotes,
      updatedAt: new Date(),
    };

    await this.firebaseService.updateDocument(
      this.APPLICATIONS_COLLECTION,
      reviewDto.applicationId,
      reviewedApplication
    );

    // If approved, create approved SPV record
    if (reviewDto.action === 'approve') {
      await this.createApprovedSPV(reviewedApplication);
    }

    // Send notification to applicant
    await this.sendReviewNotification(reviewedApplication);

    this.logger.log(
      `SPV application ${reviewDto.action}d: ${reviewDto.applicationId}`
    );
    return reviewedApplication;
  }

  /**
   * Get all approved SPVs
   */
  async getApprovedSPVs(
    limit: number = 50,
    startAfter?: string
  ): Promise<{ spvs: ApprovedSPV[]; hasMore: boolean }> {
    this.logger.log('Fetching approved SPVs');

    const docs = await this.firebaseService.getDocuments(
      this.APPROVED_SPVS_COLLECTION,
      ref => {
        let queryRef = ref.orderBy('approvedDate', 'desc').limit(limit + 1);
        if (startAfter) {
          queryRef = queryRef.startAfter(startAfter);
        }
        return queryRef;
      }
    );

    const spvs = docs.docs
      .slice(0, limit)
      .map(doc => doc.data() as ApprovedSPV);
    const hasMore = docs.docs.length > limit;

    return { spvs, hasMore };
  }

  /**
   * Suspend approved SPV
   */
  async suspendSPV(spvId: string, reason: string): Promise<void> {
    this.logger.log(`Suspending SPV: ${spvId}`);

    const doc = await this.firebaseService.getDocument(
      this.APPROVED_SPVS_COLLECTION,
      spvId
    );

    if (!doc.exists) {
      throw new NotFoundException('Approved SPV not found');
    }

    await this.firebaseService.updateDocument(
      this.APPROVED_SPVS_COLLECTION,
      spvId,
      {
        status: 'suspended',
        suspendedDate: new Date().toISOString(),
        suspensionReason: reason,
        updatedAt: new Date(),
      }
    );
  }

  /**
   * Activate suspended SPV
   */
  async activateSPV(spvId: string): Promise<void> {
    this.logger.log(`Activating SPV: ${spvId}`);

    const doc = await this.firebaseService.getDocument(
      this.APPROVED_SPVS_COLLECTION,
      spvId
    );

    if (!doc.exists) {
      throw new NotFoundException('Approved SPV not found');
    }

    await this.firebaseService.updateDocument(
      this.APPROVED_SPVS_COLLECTION,
      spvId,
      {
        status: 'active',
        suspendedDate: null,
        suspensionReason: null,
        updatedAt: new Date(),
      }
    );
  }

  /**
   * Get SPV statistics
   */
  async getSPVStats(): Promise<SPVStats> {
    this.logger.log('Generating SPV statistics');

    // Get pending applications count
    const pendingDocs = await this.firebaseService.getDocumentsByField(
      this.APPLICATIONS_COLLECTION,
      'status',
      'pending'
    );

    // Get approved SPVs count
    const approvedDocs = await this.firebaseService.getDocuments(
      this.APPROVED_SPVS_COLLECTION
    );

    const approvedSPVs = approvedDocs.docs.map(
      doc => doc.data() as ApprovedSPV
    );

    // Calculate total projects and funding
    const totalProjectsCreated = approvedSPVs.reduce(
      (total, spv) => total + spv.projectsCreated,
      0
    );

    const totalFundingFacilitated = approvedSPVs.reduce(
      (total, spv) => total + spv.totalFundingRaised,
      0
    );

    return {
      pendingApplications: pendingDocs.docs.length,
      approvedSPVs: approvedSPVs.length,
      totalProjectsCreated,
      totalFundingFacilitated,
    };
  }

  /**
   * Delete SPV application
   */
  async deleteApplication(
    applicationId: string,
    userId: string
  ): Promise<void> {
    const application = await this.getApplicationById(applicationId);

    // Check ownership
    if (application.userId !== userId) {
      throw new ForbiddenException('You can only delete your own application');
    }

    // Check if application can be deleted
    if (application.status === 'approved') {
      throw new BadRequestException('Approved applications cannot be deleted');
    }

    await this.firebaseService.deleteDocument(
      this.APPLICATIONS_COLLECTION,
      applicationId
    );

    this.logger.log(`SPV application deleted: ${applicationId}`);
  }

  /**
   * Private helper methods
   */

  private async findExistingApplication(
    userId: string
  ): Promise<SPVApplication | null> {
    const docs = await this.firebaseService.getDocuments(
      this.APPLICATIONS_COLLECTION,
      ref =>
        ref
          .where('userId', '==', userId)
          .where('status', 'in', ['pending', 'under_review', 'approved'])
          .limit(1)
    );

    if (docs.docs.length === 0) {
      return null;
    }

    return docs.docs[0].data() as SPVApplication;
  }

  private async createApprovedSPV(application: SPVApplication): Promise<void> {
    const spvId = `spv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const approvedSPV: ApprovedSPV = {
      id: spvId,
      applicationId: application.id,
      userId: application.userId,
      companyName: application.companyName,
      walletAddress: application.walletAddress,
      status: 'active',
      projectsCreated: 0,
      totalFundingRaised: 0,
      performanceScore: 10, // Initial perfect score
      lastActivity: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.firebaseService.setDocument(
      this.APPROVED_SPVS_COLLECTION,
      spvId,
      approvedSPV
    );

    this.logger.log(`Approved SPV record created: ${spvId}`);
  }

  private async notifyAdminsNewApplication(
    application: SPVApplication
  ): Promise<void> {
    try {
      // TODO: Get admin users and send notifications
      // For now, just log the notification
      this.logger.log(
        `New SPV application notification sent for: ${application.companyName}`
      );
    } catch (error) {
      this.logger.error(
        'Failed to notify admins about new SPV application',
        error
      );
    }
  }

  private async sendApplicationConfirmation(
    application: SPVApplication
  ): Promise<void> {
    try {
      await this.notificationsService.sendEmail({
        to: application.email,
        templateType: 'spv_application_confirmation',
        data: {
          companyName: application.companyName,
          contactPerson: application.contactPerson,
          applicationId: application.id,
          submittedDate: application.submittedDate,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send application confirmation email', error);
    }
  }

  private async sendReviewNotification(
    application: SPVApplication
  ): Promise<void> {
    try {
      const templateType =
        application.status === 'approved'
          ? 'spv_application_approved'
          : 'spv_application_rejected';

      await this.notificationsService.sendEmail({
        to: application.email,
        templateType,
        data: {
          companyName: application.companyName,
          contactPerson: application.contactPerson,
          applicationId: application.id,
          reviewNotes: application.reviewNotes,
          reviewedDate: application.reviewedDate,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send review notification email', error);
    }
  }
}
