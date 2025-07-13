import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard, RolesGuard, CurrentUser, Roles } from '../../common';
import { User, UserRole, KYCStatus } from '../../common/types';

@ApiTags('Users')
@Controller('users')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('onboard')
  @ApiOperation({ summary: 'Initial user registration' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async onboard(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.findOrCreateUser(createUserDto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return this.usersService.updateUser(user.id, updateUserDto);
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  async deleteAccount(@CurrentUser() user: User): Promise<{ message: string }> {
    await this.usersService.deactivateUser(user.id);
    return { message: 'Account deactivated successfully' };
  }

  // Admin endpoints
  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @Query('limit') limit: number = 50,
    @Query('startAfter') startAfter?: string
  ): Promise<User[]> {
    return this.usersService.getAllUsers(limit, startAfter);
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get users by role (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findByRole(@Param('role') role: UserRole): Promise<User[]> {
    return this.usersService.getUsersByRole(role);
  }

  @Get('kyc/:status')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get users by KYC status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findByKYCStatus(@Param('status') status: KYCStatus): Promise<User[]> {
    return this.usersService.getUsersByKYCStatus(status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Deactivate user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.deactivateUser(id);
    return { message: 'User deactivated successfully' };
  }
}
