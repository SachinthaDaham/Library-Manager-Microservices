import { Controller, Get, Put, Delete, Param } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Fines & Penalties')
@Controller('fines')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('book.overdue')
  async handleBookOverdue(@Payload() data: any) {
    console.log(`[Event Received] Book Overdue. Calculating fine for Borrow ID: ${data.borrowId}`);
    return this.appService.createFine(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fines' })
  getFines() {
    return this.appService.getAllFines();
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
