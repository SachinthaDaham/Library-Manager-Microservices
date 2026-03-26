import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { UserRole } from '../../users/user.schema';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Doe', description: 'Full name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'User role: ADMIN | LIBRARIAN | MEMBER' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 0, description: 'Override penalty points (admin only)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  penaltyPoints?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether account is active' })
  @IsOptional()
  isActive?: boolean;
}
