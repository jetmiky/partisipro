import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Logger,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ApproveProjectDto,
  ProjectStatus,
} from './dto';
import { UserRole, User } from '../../common/types';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all projects with filtering' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProjectStatus,
    description: 'Filter by project status',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by project category',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of projects to return',
  })
  @ApiQuery({
    name: 'startAfter',
    required: false,
    type: String,
    description: 'Pagination cursor',
  })
  async findAll(
    @Query('status') status?: ProjectStatus,
    @Query('category') category?: string,
    @Query('limit') limit?: number,
    @Query('startAfter') startAfter?: string
  ) {
    this.logger.log(
      `Fetching projects - Status: ${status}, Category: ${category}`
    );

    const projects = await this.projectsService.findAllProjects(
      status,
      category,
      limit ? parseInt(limit.toString()) : 20,
      startAfter
    );

    return {
      success: true,
      data: projects,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string) {
    this.logger.log(`Fetching project: ${id}`);

    const project = await this.projectsService.findProjectById(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      success: true,
      data: project,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPV, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new project (SPV only)' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - SPV access required' })
  async create(
    @CurrentUser() user: User,
    @Body() createProjectDto: CreateProjectDto
  ) {
    this.logger.log(
      `Creating project: ${createProjectDto.name} by user: ${user.id}`
    );

    const project = await this.projectsService.createProject(
      createProjectDto,
      user.id
    );

    return {
      success: true,
      message: 'Project created successfully',
      data: project,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPV, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update project (SPV only, draft status only)' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - SPV access required' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateProjectDto: UpdateProjectDto
  ) {
    this.logger.log(`Updating project: ${id} by user: ${user.id}`);

    const project = await this.projectsService.updateProject(
      id,
      updateProjectDto,
      user.id
    );

    return {
      success: true,
      message: 'Project updated successfully',
      data: project,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPV, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete project (SPV only, draft status only)' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - SPV access required' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    this.logger.log(`Deleting project: ${id} by user: ${user.id}`);

    await this.projectsService.deleteProject(id, user.id);

    return {
      success: true,
      message: 'Project deleted successfully',
    };
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPV, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit project for approval (SPV only)' })
  @ApiResponse({
    status: 200,
    description: 'Project submitted for approval successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - SPV access required' })
  async submitForApproval(@Param('id') id: string, @CurrentUser() user: User) {
    this.logger.log(
      `Submitting project for approval: ${id} by user: ${user.id}`
    );

    const project = await this.projectsService.submitForApproval(id, user.id);

    return {
      success: true,
      message: 'Project submitted for approval successfully',
      data: project,
    };
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject project (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Project approval processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async approveProject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() approveProjectDto: ApproveProjectDto
  ) {
    this.logger.log(
      `Processing project approval: ${id} - ${approveProjectDto.action} by admin: ${user.id}`
    );

    const project = await this.projectsService.approveProject(
      id,
      approveProjectDto,
      user.id
    );

    return {
      success: true,
      message: `Project ${approveProjectDto.action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: project,
    };
  }

  @Get('spv/my-projects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPV, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get projects by current SPV user' })
  @ApiResponse({
    status: 200,
    description: 'SPV projects retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - SPV access required' })
  async getMyProjects(@CurrentUser() user: User) {
    this.logger.log(`Fetching projects for SPV: ${user.id}`);

    const projects = await this.projectsService.findProjectsBySPV(user.id);

    return {
      success: true,
      data: projects,
    };
  }

  @Get('admin/pending-approval')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get projects pending approval (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Pending projects retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getPendingProjects() {
    this.logger.log('Fetching projects pending approval');

    const projects = await this.projectsService.findAllProjects(
      ProjectStatus.PENDING_APPROVAL
    );

    return {
      success: true,
      data: projects,
    };
  }
}
