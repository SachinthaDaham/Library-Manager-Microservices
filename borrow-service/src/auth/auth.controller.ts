import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─────────────────────────────────────────────
  // POST /auth/register
  // ─────────────────────────────────────────────
  @Post('register')
  @ApiOperation({ summary: 'Register a new user', description: 'Creates a new library user with a role (ADMIN, LIBRARIAN, or MEMBER). Returns a JWT access token.' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully. Returns JWT token.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ─────────────────────────────────────────────
  // POST /auth/login
  // ─────────────────────────────────────────────
  @Post('login')
  @ApiOperation({ summary: 'Login with email + password', description: 'Authenticates a user and returns a JWT access token with user info.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful. Returns JWT token and user info.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ─────────────────────────────────────────────
  // GET /auth/profile  (requires JWT)
  // ─────────────────────────────────────────────
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get logged-in user profile', description: 'Returns the profile of the currently authenticated user from the JWT token.' })
  @ApiResponse({ status: 200, description: 'Returns user profile.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token.' })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}
