import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateFineDto } from './dto/create-fine.dto';

@ApiTags('Fines & Penalties')
@Controller('fines')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('book.overdue')
  async handleBookOverdue(@Payload() data: any) {
    console.log(`[Event] Book Overdue: auto-fine for Borrow ${data.borrowId}`);
    return this.appService.createFine(data);
  }

  @Post()
  @ApiOperation({ summary: 'Create a fine directly (admin use)' })
  createFine(@Body() body: CreateFineDto) {
    return this.appService.createFine(body);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get fine statistics (total unpaid, paid, outstanding balance)' })
  getFineStats() {
    return this.appService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'Get all fines (admin/librarian view)' })
  getFines() {
    return this.appService.getAllFines();
  }

  @Get('member/:memberId')
  @ApiOperation({ summary: 'Get fines for a specific member' })
  getFinesByMember(@Param('memberId') memberId: string) {
    return this.appService.getFinesByMember(memberId);
  }

  @Put(':id/pay')
  @ApiOperation({ summary: 'Mark a fine as paid' })
  payFine(@Param('id') id: string) {
    return this.appService.payFine(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a fine record entirely' })
  deleteFine(@Param('id') id: string) {
    return this.appService.removeFine(id);
  }
}
