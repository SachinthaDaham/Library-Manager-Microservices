import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFineDto {
  @ApiProperty({ example: '64b1f...a1', description: 'User Member ID' })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ example: '64c2d...b9', description: 'Borrow Record ID' })
  @IsString()
  @IsNotEmpty()
  borrowId: string;

  @ApiPropertyOptional({ example: 1, description: 'Number of days overdue' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  overdueDays?: number;
}
