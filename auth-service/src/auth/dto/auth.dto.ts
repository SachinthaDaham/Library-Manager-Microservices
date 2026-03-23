import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsStrongPassword } from 'class-validator';
import { UserRole } from '../../users/user.schema';

export class RegisterDto {
  @ApiProperty({ example: 'Sachintha Daham', description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'admin@library.com', description: 'Email address (must be unique)' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Pass@word123', description: 'Strong password (min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol)' })
  @IsString()
  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }, {
    message: 'Password must be at least 8 characters long, and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
  })
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.MEMBER,
    description: 'Role: ADMIN | LIBRARIAN | MEMBER',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@library.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
