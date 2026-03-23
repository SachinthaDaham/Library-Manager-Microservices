import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BorrowsService } from './borrows.service';
import { CreateBorrowDto } from './dto/create-borrow.dto';
import { ReturnBorrowDto } from './dto/return-borrow.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Borrows')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('borrows')
export class BorrowsController {
  constructor(private readonly borrowsService: BorrowsService) {}

  // POST /borrows — ADMIN, LIBRARIAN
  @Post()
  @Roles('ADMIN', 'LIBRARIAN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Borrow a book', description: 'Creates a new borrow record. Requires ADMIN or LIBRARIAN role.' })
  @ApiBody({ type: CreateBorrowDto })
  @ApiResponse({ status: 201, description: 'Book successfully borrowed.' })
  @ApiResponse({ status: 400, description: 'Book already borrowed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role.' })
  create(@Body() createBorrowDto: CreateBorrowDto) {
    return this.borrowsService.create(createBorrowDto);
  }

  // GET /borrows — ADMIN, LIBRARIAN
  @Get()
  @Roles('ADMIN', 'LIBRARIAN')
  @ApiOperation({ summary: 'Get all borrow records', description: 'Requires ADMIN or LIBRARIAN role.' })
  @ApiResponse({ status: 200, description: 'List of all borrow records.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.borrowsService.findAll();
  }

  // GET /borrows/stats — ADMIN, LIBRARIAN
  @Get('stats')
  @Roles('ADMIN', 'LIBRARIAN')
  @ApiOperation({ summary: 'Get borrow statistics', description: 'Requires ADMIN or LIBRARIAN.' })
  @ApiResponse({ status: 200, description: 'Borrow statistics.', schema: { example: { total: 10, active: 4, returned: 5, overdue: 1 } } })
  getStats() {
    return this.borrowsService.getStats();
  }

  // GET /borrows/member/:memberId — all roles
  @Get('member/:memberId')
  @Roles('ADMIN', 'LIBRARIAN', 'MEMBER')
  @ApiOperation({ summary: 'Get borrows by member', description: 'Any authenticated role can access.' })
  @ApiParam({ name: 'memberId', example: 'member-001' })
  @ApiResponse({ status: 200, description: 'Member borrow records.' })
  findByMember(@Param('memberId') memberId: string) {
    return this.borrowsService.findByMember(memberId);
  }

  // GET /borrows/book/:bookId — ADMIN, LIBRARIAN
  @Get('book/:bookId')
  @Roles('ADMIN', 'LIBRARIAN')
  @ApiOperation({ summary: 'Get borrows by book', description: 'Requires ADMIN or LIBRARIAN.' })
  @ApiParam({ name: 'bookId', example: 'book-001' })
  @ApiResponse({ status: 200, description: 'Book borrow history.' })
  findByBook(@Param('bookId') bookId: string) {
    return this.borrowsService.findByBook(bookId);
  }

  // GET /borrows/:id — ADMIN, LIBRARIAN
  @Get(':id')
  @Roles('ADMIN', 'LIBRARIAN')
  @ApiOperation({ summary: 'Get a borrow record by ID' })
  @ApiParam({ name: 'id', example: 'sample-borrow-001' })
  @ApiResponse({ status: 200, description: 'Borrow record.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  findOne(@Param('id') id: string) {
    return this.borrowsService.findOne(id);
  }

  // PUT /borrows/:id/return — ADMIN, LIBRARIAN
  @Put(':id/return')
  @Roles('ADMIN', 'LIBRARIAN')
  @ApiOperation({ summary: 'Return a borrowed book', description: 'Marks the borrow as RETURNED. Requires ADMIN or LIBRARIAN.' })
  @ApiParam({ name: 'id', example: 'sample-borrow-002' })
  @ApiBody({ type: ReturnBorrowDto })
  @ApiResponse({ status: 200, description: 'Book returned.' })
  @ApiResponse({ status: 400, description: 'Already returned.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  returnBook(@Param('id') id: string, @Body() returnBorrowDto: ReturnBorrowDto) {
    return this.borrowsService.returnBook(id, returnBorrowDto);
  }
}
