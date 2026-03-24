import { Controller, Get, Post, Body, Param, Put, Delete, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BooksService } from './books.service';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new book to the catalog' })
  async create(@Body() createDto: any) {
    if (!createDto.title || !createDto.author || !createDto.genre || !createDto.totalCopies) {
      throw new BadRequestException('Missing required fields');
    }
    return this.booksService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all books' })
  async findAll() {
    return this.booksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific book by ID' })
  async findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a book details' })
  async update(@Param('id') id: string, @Body() updateDto: any) {
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
}
