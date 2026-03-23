import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';

export class CreateBorrowDto {
  @ApiProperty({
    description: 'The ID of the library member borrowing the book',
    example: 'member-001',
  })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({
    description: 'The ID of the book being borrowed',
    example: 'book-001',
  })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiPropertyOptional({
    description: 'Loan duration in days (default: 14 days)',
    example: 14,
    default: 14,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  loanDurationDays?: number;

  @ApiPropertyOptional({
    description: 'Optional notes about the borrow transaction',
    example: 'Member requested extended loan period',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
