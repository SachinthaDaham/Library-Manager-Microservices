import {
  Controller, Post, Get, Put, Delete, Body, UseGuards, Request, Param, HttpCode, HttpStatus
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '../users/user.schema';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Public Auth ───────────────────────────────────────────────────────────

  @Post('register')
  @ApiOperation({ summary: 'Register a new library user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User created. Returns JWT + user info.' })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email + password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful. Returns JWT + user info.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile (requires JWT)' })
  @ApiResponse({ status: 200, description: 'Returns authenticated user profile.' })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  // ─── Admin: User Management ────────────────────────────────────────────────

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all users (Admin/Librarian only)' })
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get single user by ID (Admin/Librarian only)' })
  getUserById(@Param('id') id: string) {
    return this.authService.getUserById(id);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user name, role, or penalty points (Admin only)' })
  @ApiBody({ type: UpdateUserDto })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user account (Admin only)' })
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }

  // ─── Service-to-Service: Penalty ──────────────────────────────────────────

  @Post('users/:id/penalty')
  @ApiOperation({ summary: 'Add a penalty point to a user (Service-to-Service)' })
  addPenalty(@Param('id') userId: string) {
    return this.authService.addPenalty(userId);
  }

  @Delete('users/:id/penalty')
  @ApiOperation({ summary: 'Remove a penalty point from a user (Service-to-Service)' })
  removePenalty(@Param('id') userId: string) {
    return this.authService.removePenalty(userId);
  }

  @Get('users/:id/penalty-status')
  @ApiOperation({ summary: 'Get penalty points for a user (Service-to-Service)' })
  async getPenaltyStatus(@Param('id') userId: string) {
    const user = await this.authService.getUserById(userId);
    return { penaltyPoints: user.penaltyPoints || 0 };
  }
}
