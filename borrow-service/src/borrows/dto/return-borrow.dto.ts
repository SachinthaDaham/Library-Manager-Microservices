import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReturnBorrowDto {
  @ApiPropertyOptional({
    description: 'Optional notes about the return (e.g., condition of the book)',
    example: 'Book returned in good condition',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
