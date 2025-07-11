import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { FirebaseService } from '../src/common/services/firebase.service';
import { ProjectsService } from '../src/modules/projects/projects.service';
import { CreateProjectDto, ProjectStatus } from '../src/modules/projects/dto';
import { UserRole } from '../src/common/types';
import { generateTestJWT, createMockProject } from './setup';

describe('ProjectsController (e2e)', () => {
  let app: INestApplication;
  // let _firebaseService: jest.Mocked<FirebaseService>;
  let projectsService: jest.Mocked<ProjectsService>;

  const mockFirebaseService = {
    setDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    getDocument: jest.fn(),
    getDocuments: jest.fn(),
    getDocumentsByField: jest.fn(),
    getTimestamp: jest.fn(() => new Date()),
  };

  const mockProjectsService = {
    createProject: jest.fn(),
    findProjectById: jest.fn(),
    findAllProjects: jest.fn(),
    findProjectsBySPV: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
    submitForApproval: jest.fn(),
    approveProject: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FirebaseService)
      .useValue(mockFirebaseService)
      .overrideProvider(ProjectsService)
      .useValue(mockProjectsService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // _firebaseService = moduleFixture.get(FirebaseService);
    projectsService = moduleFixture.get(ProjectsService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /projects', () => {
    it('should return all projects for authenticated user', async () => {
      const mockProjects = [
        createMockProject({ id: 'proj1', status: ProjectStatus.ACTIVE }),
        createMockProject({ id: 'proj2', status: ProjectStatus.ACTIVE }),
      ];

      projectsService.findAllProjects.mockResolvedValue(mockProjects);

      const token = generateTestJWT({ role: UserRole.INVESTOR });

      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'proj1' }),
          expect.objectContaining({ id: 'proj2' }),
        ]),
      });

      expect(projectsService.findAllProjects).toHaveBeenCalledWith(
        undefined,
        undefined,
        20,
        undefined
      );
    });

    it('should return filtered projects with query parameters', async () => {
      const mockProjects = [
        createMockProject({
          id: 'proj1',
          status: ProjectStatus.ACTIVE,
          category: 'transportation',
        }),
      ];

      projectsService.findAllProjects.mockResolvedValue(mockProjects);

      const token = generateTestJWT({ role: UserRole.INVESTOR });

      const response = await request(app.getHttpServer())
        .get('/projects')
        .query({
          status: ProjectStatus.ACTIVE,
          category: 'transportation',
          limit: 10,
        })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(projectsService.findAllProjects).toHaveBeenCalledWith(
        ProjectStatus.ACTIVE,
        'transportation',
        10,
        undefined
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      await request(app.getHttpServer()).get('/projects').expect(401);
    });
  });

  describe('GET /projects/:id', () => {
    it('should return project by id', async () => {
      const projectId = 'test-project-id';
      const mockProject = createMockProject({ id: projectId });

      projectsService.findProjectById.mockResolvedValue(mockProject);

      const token = generateTestJWT({ role: UserRole.INVESTOR });

      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({ id: projectId }),
      });

      expect(projectsService.findProjectById).toHaveBeenCalledWith(projectId);
    });

    it('should return 404 for non-existent project', async () => {
      const projectId = 'non-existent-project';

      projectsService.findProjectById.mockResolvedValue(null);

      const token = generateTestJWT({ role: UserRole.INVESTOR });

      await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /projects', () => {
    const createProjectDto: CreateProjectDto = {
      name: 'Test Project',
      description: 'Test project description',
      category: 'transportation',
      province: 'Test Province',
      city: 'Test City',
      totalValue: 1000000000,
      tokenPrice: 100000,
      totalTokens: 10000,
      minimumInvestment: 1000000,
      maximumInvestment: 100000000,
      tokenSymbol: 'TEST',
      tokenName: 'Test Token',
      offeringStartDate: '2024-02-01',
      offeringEndDate: '2024-12-31',
      concessionStartDate: '2025-01-01',
      concessionEndDate: '2030-12-31',
      expectedAnnualReturn: 10.0,
      riskLevel: 3,
    };

    it('should create project for SPV user', async () => {
      const mockProject = createMockProject({
        id: 'new-project-id',
        name: createProjectDto.name,
      });

      projectsService.createProject.mockResolvedValue(mockProject);

      const token = generateTestJWT({ role: UserRole.SPV });

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(createProjectDto)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Project created successfully',
        data: expect.objectContaining({
          name: createProjectDto.name,
        }),
      });

      expect(projectsService.createProject).toHaveBeenCalledWith(
        createProjectDto,
        expect.any(String)
      );
    });

    it('should return 403 for investor user', async () => {
      const token = generateTestJWT({ role: UserRole.INVESTOR });

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(createProjectDto)
        .expect(403);
    });

    it('should return 400 for invalid project data', async () => {
      const invalidDto = {
        ...createProjectDto,
        name: '', // Empty name
      };

      const token = generateTestJWT({ role: UserRole.SPV });

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('PUT /projects/:id', () => {
    const updateProjectDto = {
      name: 'Updated Project Name',
      description: 'Updated description',
    };

    it('should update project for authorized SPV', async () => {
      const projectId = 'test-project-id';
      const mockProject = createMockProject({
        id: projectId,
        name: updateProjectDto.name,
        description: updateProjectDto.description,
      });

      projectsService.updateProject.mockResolvedValue(mockProject);

      const token = generateTestJWT({ role: UserRole.SPV });

      const response = await request(app.getHttpServer())
        .put(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateProjectDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Project updated successfully',
        data: expect.objectContaining({
          name: updateProjectDto.name,
          description: updateProjectDto.description,
        }),
      });

      expect(projectsService.updateProject).toHaveBeenCalledWith(
        projectId,
        updateProjectDto,
        expect.any(String)
      );
    });

    it('should return 403 for investor user', async () => {
      const projectId = 'test-project-id';
      const token = generateTestJWT({ role: UserRole.INVESTOR });

      await request(app.getHttpServer())
        .put(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateProjectDto)
        .expect(403);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete project for authorized SPV', async () => {
      const projectId = 'test-project-id';

      projectsService.deleteProject.mockResolvedValue(undefined);

      const token = generateTestJWT({ role: UserRole.SPV });

      const response = await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Project deleted successfully',
      });

      expect(projectsService.deleteProject).toHaveBeenCalledWith(
        projectId,
        expect.any(String)
      );
    });

    it('should return 403 for investor user', async () => {
      const projectId = 'test-project-id';
      const token = generateTestJWT({ role: UserRole.INVESTOR });

      await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /projects/:id/submit', () => {
    it('should submit project for approval', async () => {
      const projectId = 'test-project-id';
      const mockProject = createMockProject({
        id: projectId,
        status: ProjectStatus.PENDING_APPROVAL,
      });

      projectsService.submitForApproval.mockResolvedValue(mockProject);

      const token = generateTestJWT({ role: UserRole.SPV });

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Project submitted for approval successfully',
        data: expect.objectContaining({
          status: ProjectStatus.PENDING_APPROVAL,
        }),
      });

      expect(projectsService.submitForApproval).toHaveBeenCalledWith(
        projectId,
        expect.any(String)
      );
    });
  });

  describe('POST /projects/:id/approve', () => {
    const approveProjectDto = {
      action: 'approve',
      reason: 'Project meets all requirements',
      adminNotes: 'Approved by admin',
    };

    it('should approve project for admin user', async () => {
      const projectId = 'test-project-id';
      const mockProject = createMockProject({
        id: projectId,
        status: ProjectStatus.APPROVED,
      });

      projectsService.approveProject.mockResolvedValue(mockProject);

      const token = generateTestJWT({ role: UserRole.ADMIN });

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send(approveProjectDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Project approved successfully',
        data: expect.objectContaining({
          status: ProjectStatus.APPROVED,
        }),
      });

      expect(projectsService.approveProject).toHaveBeenCalledWith(
        projectId,
        approveProjectDto,
        expect.any(String)
      );
    });

    it('should return 403 for non-admin user', async () => {
      const projectId = 'test-project-id';
      const token = generateTestJWT({ role: UserRole.SPV });

      await request(app.getHttpServer())
        .post(`/projects/${projectId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send(approveProjectDto)
        .expect(403);
    });
  });

  describe('GET /projects/spv/my-projects', () => {
    it('should return SPV projects', async () => {
      const mockProjects = [
        createMockProject({ id: 'proj1', spvId: 'test-spv-id' }),
        createMockProject({ id: 'proj2', spvId: 'test-spv-id' }),
      ];

      projectsService.findProjectsBySPV.mockResolvedValue(mockProjects);

      const token = generateTestJWT({ role: UserRole.SPV, sub: 'test-spv-id' });

      const response = await request(app.getHttpServer())
        .get('/projects/spv/my-projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'proj1' }),
          expect.objectContaining({ id: 'proj2' }),
        ]),
      });

      expect(projectsService.findProjectsBySPV).toHaveBeenCalledWith(
        'test-spv-id'
      );
    });

    it('should return 403 for investor user', async () => {
      const token = generateTestJWT({ role: UserRole.INVESTOR });

      await request(app.getHttpServer())
        .get('/projects/spv/my-projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('GET /projects/admin/pending-approval', () => {
    it('should return pending projects for admin', async () => {
      const mockProjects = [
        createMockProject({
          id: 'proj1',
          status: ProjectStatus.PENDING_APPROVAL,
        }),
        createMockProject({
          id: 'proj2',
          status: ProjectStatus.PENDING_APPROVAL,
        }),
      ];

      projectsService.findAllProjects.mockResolvedValue(mockProjects);

      const token = generateTestJWT({ role: UserRole.ADMIN });

      const response = await request(app.getHttpServer())
        .get('/projects/admin/pending-approval')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ status: ProjectStatus.PENDING_APPROVAL }),
        ]),
      });

      expect(projectsService.findAllProjects).toHaveBeenCalledWith(
        ProjectStatus.PENDING_APPROVAL
      );
    });

    it('should return 403 for non-admin user', async () => {
      const token = generateTestJWT({ role: UserRole.SPV });

      await request(app.getHttpServer())
        .get('/projects/admin/pending-approval')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
