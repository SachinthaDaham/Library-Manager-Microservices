import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: 'The Great Gatsby' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald' })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty({ example: 'Classic' })
  @IsString()
  @IsNotEmpty()
  genre: string;

  @ApiPropertyOptional({ example: 'A classic novel of the jazz age.', description: 'Brief description of the book' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 5, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalCopies?: number;
}
