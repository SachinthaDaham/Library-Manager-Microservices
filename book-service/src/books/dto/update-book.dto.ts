import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'The Great Gatsby' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'F. Scott Fitzgerald' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ example: 'Classic' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ example: 'A classic novel of the jazz age.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalCopies?: number;
}
