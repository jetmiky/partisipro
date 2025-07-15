import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  UseGuards,
  // Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/types';
import {
  UploadFileDto,
  FileUploadResponseDto,
  FileDownloadResponseDto,
  FileListResponseDto,
  GetFilesDto,
  GetUserFilesDto,
  GetProjectFilesDto,
} from './dto';

@ApiTags('Files')
@Controller('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'File too large' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
    @CurrentUser() user: any
  ): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    return this.filesService.uploadFile(file, uploadFileDto, user.id);
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiResponse({
    status: 200,
    description: 'File retrieved successfully',
    type: FileDownloadResponseDto,
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFile(
    @Param('fileId') fileId: string,
    @CurrentUser() user: any
  ): Promise<FileDownloadResponseDto> {
    return this.filesService.getFile(fileId, user.id, user.role);
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete file by ID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteFile(
    @Param('fileId') fileId: string,
    @CurrentUser() user: any
  ): Promise<{ message: string }> {
    await this.filesService.deleteFile(fileId, user.id, user.role);
    return { message: 'File deleted successfully' };
  }

  @Get('user/me')
  @ApiOperation({ summary: 'Get current user files' })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    type: FileListResponseDto,
  })
  async getUserFiles(
    @Query() query: GetUserFilesDto,
    @CurrentUser() user: any
  ): Promise<FileListResponseDto> {
    return this.filesService.getUserFiles(user.id, query.category);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get files by user ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    type: FileListResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserFilesById(
    @Param('userId') userId: string,
    @Query() query: GetUserFilesDto
  ): Promise<FileListResponseDto> {
    return this.filesService.getUserFiles(userId, query.category);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get files by project ID' })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    type: FileListResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectFiles(
    @Param('projectId') projectId: string,
    @Query() query: GetProjectFilesDto,
    @CurrentUser() user: any
  ): Promise<FileListResponseDto> {
    return this.filesService.getProjectFiles(
      projectId,
      user.id,
      user.role,
      query.category
    );
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get files by category' })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    type: FileListResponseDto,
  })
  async getFilesByCategory(
    @Param('category') category: string,
    @Query() query: GetFilesDto,
    @CurrentUser() user: any
  ): Promise<FileListResponseDto> {
    return this.filesService.getFilesByCategory(
      category,
      user.id,
      user.role,
      query.userId
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all files (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    type: FileListResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllFiles(@Query() query: GetFilesDto): Promise<FileListResponseDto> {
    return this.filesService.getAllFiles(query);
  }

  @Post(':fileId/regenerate-url')
  @ApiOperation({ summary: 'Regenerate signed URL for file' })
  @ApiResponse({
    status: 200,
    description: 'URL regenerated successfully',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async regenerateSignedUrl(
    @Param('fileId') fileId: string,
    @CurrentUser() user: any
  ): Promise<{ downloadUrl: string }> {
    return this.filesService.regenerateSignedUrl(fileId, user.id, user.role);
  }
}
