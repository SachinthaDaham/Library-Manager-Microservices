import { Controller, Get, Post, Body, Param, Put, Delete, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new book to the catalog' })
  async create(@Body() createDto: CreateBookDto) {
    return this.booksService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all books' })
  async findAll() {
    return this.booksService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search and filter books' })
  @ApiQuery({ name: 'q', required: false, description: 'Search term for title or author' })
  @ApiQuery({ name: 'genre', required: false, description: 'Filter by genre' })
  async search(@Query('q') q?: string, @Query('genre') genre?: string) {
    return this.booksService.search(q, genre);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific book by ID' })
  async findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a book details' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateBookDto) {
    return this.booksService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book from catalog' })
  async remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }

  @Put(':id/availability')
  @ApiOperation({ summary: 'Update book availability (borrow/return synchronisation)' })
  async updateAvailability(@Param('id') id: string, @Body() body: { action: 'borrow' | 'return' }) {
    if (body.action !== 'borrow' && body.action !== 'return') {
      throw new BadRequestException('Action must be borrow or return');
    }
    return this.booksService.updateAvailability(id, body.action);
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Add a rating and review for a book' })
  async addReview(
    @Param('id') id: string, 
    @Body() body: { memberId: string, rating: number, comment?: string }
  ) {
    if (!body.memberId || !body.rating) throw new BadRequestException('memberId and rating are required');
    if (body.rating < 1 || body.rating > 5) throw new BadRequestException('Rating must be between 1 and 5');
    return this.booksService.addReview(id, body.memberId, body.rating, body.comment);
  }
}
