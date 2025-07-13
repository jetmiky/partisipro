import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import {
  CacheService,
  CacheKeys,
  CacheTTL,
} from '../../common/services/cache.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ApproveProjectDto,
  ProjectStatus,
  ApprovalAction,
} from './dto';
import { Project, OfferingStatus } from '../../common/types';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly PROJECTS_COLLECTION = 'projects';
  private readonly APPROVAL_TIMEOUT = 5000; // 5 seconds for mock approval

  constructor(
    private firebaseService: FirebaseService,
    private cacheService: CacheService
  ) {}

  /**
   * Create a new project (SPV only)
   */
  async createProject(
    createProjectDto: CreateProjectDto,
    spvId: string
  ): Promise<Project> {
    this.logger.log(
      `Creating project: ${createProjectDto.name} for SPV: ${spvId}`
    );

    // Validate dates
    this.validateProjectDates(createProjectDto);

    // Generate project ID
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create project object
    const project: Project = {
      id: projectId,
      spvId,
      name: createProjectDto.name,
      description: createProjectDto.description,
      category: createProjectDto.category,
      location: {
        province: createProjectDto.province,
        city: createProjectDto.city,
      },
      financial: {
        totalValue: createProjectDto.totalValue,
        tokenPrice: createProjectDto.tokenPrice,
        totalTokens: createProjectDto.totalTokens,
        minimumInvestment: createProjectDto.minimumInvestment,
        maximumInvestment: createProjectDto.maximumInvestment,
      },
      tokenization: {
        tokenSymbol: createProjectDto.tokenSymbol,
        tokenName: createProjectDto.tokenName,
        decimals: 18, // Standard ERC-20 decimals
        contractAddress: '', // Will be set after contract deployment
      },
      offering: {
        startDate: new Date(createProjectDto.offeringStartDate),
        endDate: new Date(createProjectDto.offeringEndDate),
        status: OfferingStatus.UPCOMING,
        soldTokens: 0,
        raisedAmount: 0,
      },
      concession: {
        startDate: new Date(createProjectDto.concessionStartDate),
        endDate: new Date(createProjectDto.concessionEndDate),
        duration: this.calculateConcessionDuration(
          createProjectDto.concessionStartDate,
          createProjectDto.concessionEndDate
        ),
      },
      expectedAnnualReturn: createProjectDto.expectedAnnualReturn,
      riskLevel: createProjectDto.riskLevel,
      documents:
        createProjectDto.documentUrls?.map(url => ({
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: url.split('/').pop() || 'document',
          type: 'application/pdf',
          url,
          size: 0,
          uploadedAt: new Date(),
          uploadedBy: spvId,
        })) || [],
      additionalDetails: createProjectDto.additionalDetails,
      status: ProjectStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    await this.firebaseService.setDocument(
      this.PROJECTS_COLLECTION,
      projectId,
      project
    );

    // Invalidate project list caches since new project was added
    await this.invalidateProjectListCaches();

    this.logger.log(`Project created: ${projectId}`);
    return project;
  }

  /**
   * Submit project for approval
   */
  async submitForApproval(projectId: string, spvId: string): Promise<Project> {
    this.logger.log(`Submitting project for approval: ${projectId}`);

    const project = await this.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.spvId !== spvId) {
      throw new BadRequestException('Unauthorized to submit this project');
    }

    if (project.status !== ProjectStatus.DRAFT) {
      throw new BadRequestException(
        'Project must be in draft status to submit for approval'
      );
    }

    // Update project status
    const updatedProject = {
      ...project,
      status: ProjectStatus.PENDING_APPROVAL,
      updatedAt: new Date(),
    };

    await this.firebaseService.updateDocument(
      this.PROJECTS_COLLECTION,
      projectId,
      {
        status: ProjectStatus.PENDING_APPROVAL,
        updatedAt: this.firebaseService.getTimestamp(),
      }
    );

    // TODO: In production, send notification to admins
    this.logger.log(`Project submitted for approval: ${projectId}`);

    return updatedProject;
  }

  /**
   * Approve or reject project (Admin only)
   */
  async approveProject(
    projectId: string,
    approveProjectDto: ApproveProjectDto,
    adminId: string
  ): Promise<Project> {
    this.logger.log(
      `Processing project approval: ${projectId} - ${approveProjectDto.action}`
    );

    const project = await this.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== ProjectStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Project must be pending approval');
    }

    const newStatus =
      approveProjectDto.action === ApprovalAction.APPROVE
        ? ProjectStatus.APPROVED
        : ProjectStatus.DRAFT;

    // Update project status and approval details
    const updateData = {
      status: newStatus,
      updatedAt: this.firebaseService.getTimestamp(),
      approval: {
        adminId,
        action: approveProjectDto.action,
        reason: approveProjectDto.reason,
        adminNotes: approveProjectDto.adminNotes,
        processedAt: this.firebaseService.getTimestamp(),
      },
    };

    await this.firebaseService.updateDocument(
      this.PROJECTS_COLLECTION,
      projectId,
      updateData
    );

    // If approved, simulate contract deployment
    if (approveProjectDto.action === ApprovalAction.APPROVE) {
      this.simulateContractDeployment(projectId);
    }

    const updatedProject = {
      ...project,
      ...updateData,
      updatedAt: new Date(),
    };

    this.logger.log(
      `Project ${approveProjectDto.action === ApprovalAction.APPROVE ? 'approved' : 'rejected'}: ${projectId}`
    );

    return updatedProject;
  }

  /**
   * Get all projects with filtering and pagination (with caching)
   */
  async findAllProjects(
    status?: ProjectStatus,
    category?: string,
    limit: number = 20,
    startAfter?: string
  ): Promise<Project[]> {
    this.logger.log(
      `Fetching projects - Status: ${status}, Category: ${category}`
    );

    // Create cache key based on query parameters
    const filterKey = `${status || 'all'}_${category || 'all'}_${limit}_${startAfter || 'start'}`;
    const cacheKey = CacheKeys.PROJECT_LIST(filterKey);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const query = (ref: FirebaseFirestore.Query) => {
          let q = ref.orderBy('createdAt', 'desc');

          if (status) {
            q = q.where('status', '==', status);
          }

          if (category) {
            q = q.where('category', '==', category);
          }

          q = q.limit(limit);

          if (startAfter) {
            q = q.startAfter(startAfter);
          }

          return q;
        };

        const docs = await this.firebaseService.getDocuments(
          this.PROJECTS_COLLECTION,
          query
        );

        return docs.docs.map(doc => doc.data() as Project);
      },
      { ttl: CacheTTL.SHORT } // Shorter TTL for list data that changes more frequently
    );
  }

  /**
   * Get projects by SPV
   */
  async findProjectsBySPV(spvId: string): Promise<Project[]> {
    this.logger.log(`Fetching projects for SPV: ${spvId}`);

    const docs = await this.firebaseService.getDocumentsByField(
      this.PROJECTS_COLLECTION,
      'spvId',
      spvId
    );

    return docs.docs.map(doc => doc.data() as Project);
  }

  /**
   * Get project by ID (with caching)
   */
  async findProjectById(projectId: string): Promise<Project | null> {
    const cacheKey = CacheKeys.PROJECT_DETAILS(projectId);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const doc = await this.firebaseService.getDocument(
          this.PROJECTS_COLLECTION,
          projectId
        );

        if (!doc.exists) {
          return null;
        }

        return doc.data() as Project;
      },
      { ttl: CacheTTL.MEDIUM }
    );
  }

  /**
   * Update project (SPV only, draft status only)
   */
  async updateProject(
    projectId: string,
    updateProjectDto: UpdateProjectDto,
    spvId: string
  ): Promise<Project> {
    this.logger.log(`Updating project: ${projectId}`);

    const project = await this.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.spvId !== spvId) {
      throw new BadRequestException('Unauthorized to update this project');
    }

    if (project.status !== ProjectStatus.DRAFT) {
      throw new BadRequestException('Can only update projects in draft status');
    }

    // Validate dates if provided
    if (
      updateProjectDto.offeringStartDate ||
      updateProjectDto.offeringEndDate ||
      updateProjectDto.concessionStartDate ||
      updateProjectDto.concessionEndDate
    ) {
      this.validateProjectDates({ ...project, ...updateProjectDto });
    }

    const updateData = {
      ...updateProjectDto,
      updatedAt: this.firebaseService.getTimestamp(),
    };

    await this.firebaseService.updateDocument(
      this.PROJECTS_COLLECTION,
      projectId,
      updateData
    );

    // Invalidate caches after update
    await this.invalidateProjectCaches(projectId);

    const updatedProject = {
      ...project,
      ...updateData,
      updatedAt: new Date(),
    };

    this.logger.log(`Project updated: ${projectId}`);

    return updatedProject;
  }

  /**
   * Delete project (SPV only, draft status only)
   */
  async deleteProject(projectId: string, spvId: string): Promise<void> {
    this.logger.log(`Deleting project: ${projectId}`);

    const project = await this.findProjectById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.spvId !== spvId) {
      throw new BadRequestException('Unauthorized to delete this project');
    }

    if (project.status !== ProjectStatus.DRAFT) {
      throw new BadRequestException('Can only delete projects in draft status');
    }

    await this.firebaseService.deleteDocument(
      this.PROJECTS_COLLECTION,
      projectId
    );

    this.logger.log(`Project deleted: ${projectId}`);
  }

  /**
   * Validate project dates
   */
  private validateProjectDates(projectData: any): void {
    const offeringStart = new Date(projectData.offeringStartDate);
    const offeringEnd = new Date(projectData.offeringEndDate);
    const concessionStart = new Date(projectData.concessionStartDate);
    const concessionEnd = new Date(projectData.concessionEndDate);

    if (offeringStart >= offeringEnd) {
      throw new BadRequestException(
        'Offering start date must be before end date'
      );
    }

    if (concessionStart >= concessionEnd) {
      throw new BadRequestException(
        'Concession start date must be before end date'
      );
    }

    if (offeringEnd > concessionStart) {
      throw new BadRequestException(
        'Offering must end before concession starts'
      );
    }

    if (offeringStart <= new Date()) {
      throw new BadRequestException(
        'Offering start date must be in the future'
      );
    }
  }

  /**
   * Calculate concession duration in years
   */
  private calculateConcessionDuration(
    startDate: string,
    endDate: string
  ): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.round(diffDays / 365);
  }

  /**
   * Simulate contract deployment (mock implementation)
   * TODO: Replace with real smart contract deployment
   */
  private async simulateContractDeployment(projectId: string): Promise<void> {
    this.logger.log(`Simulating contract deployment for project: ${projectId}`);

    // Simulate deployment delay
    setTimeout(async () => {
      try {
        // Generate mock contract address
        const mockContractAddress = `0x${Math.random().toString(16).substr(2, 40)}`;

        // Update project with contract address
        await this.firebaseService.updateDocument(
          this.PROJECTS_COLLECTION,
          projectId,
          {
            'tokenization.contractAddress': mockContractAddress,
            status: ProjectStatus.ACTIVE,
            updatedAt: this.firebaseService.getTimestamp(),
          }
        );

        this.logger.log(
          `Mock contract deployed for project: ${projectId} at ${mockContractAddress}`
        );
      } catch (error) {
        this.logger.error(
          `Mock contract deployment failed for project: ${projectId}`,
          error
        );
      }
    }, this.APPROVAL_TIMEOUT);
  }

  /**
   * Invalidate all caches related to a specific project
   */
  private async invalidateProjectCaches(projectId: string): Promise<void> {
    try {
      // Invalidate specific project cache
      await this.cacheService.delete(CacheKeys.PROJECT_DETAILS(projectId));

      // Invalidate project list caches
      await this.invalidateProjectListCaches();

      this.logger.debug(`Invalidated caches for project: ${projectId}`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate caches for project: ${projectId}`,
        error
      );
    }
  }

  /**
   * Invalidate all project list caches
   */
  private async invalidateProjectListCaches(): Promise<void> {
    try {
      // Invalidate all project list cache variations
      await this.cacheService.deletePattern('partisipro:project:list:*');

      // Also invalidate platform analytics that might include project counts
      await this.cacheService.delete(CacheKeys.PLATFORM_ANALYTICS());

      this.logger.debug('Invalidated all project list caches');
    } catch (error) {
      this.logger.error('Failed to invalidate project list caches', error);
    }
  }
}
