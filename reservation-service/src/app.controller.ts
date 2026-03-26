import { Controller, Get, Post, Body, Put, Delete, Param } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reservations (Subscriber)')
@Controller('reservations')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('book.returned')
  async handleBookReturned(@Payload() data: any) {
    console.log(`[Event Received] Book Returned: ${data.bookId}`);
    return this.appService.handleBookReturned(data);
  }

  @Post()
  @ApiOperation({ summary: 'Create a reservation for a book' })
  createReservation(@Body() data: any) {
    return this.appService.createReservation(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reservations' })
  getReservations() {
    return this.appService.getAll();
  }

  @Get('member/:memberId')
  @ApiOperation({ summary: 'Get reservations for a specific member' })
  getReservationsByMember(@Param('memberId') memberId: string) {
    return this.appService.getByMember(memberId);
  }

  @Get('book/:bookId/queue')
  @ApiOperation({ summary: 'Get reservation queue for a specific book' })
  getQueueForBook(@Param('bookId') bookId: string) {
    return this.appService.getQueueForBook(bookId);
  }

  @Get('book/:bookId/holds')
  @ApiOperation({ summary: 'Get active fulfilled holds for a specific book' })
  getHoldsForBook(@Param('bookId') bookId: string) {
    return this.appService.getHoldsForBook(bookId);
  }

  @Delete('book/:bookId/member/:memberId/consume')
  @ApiOperation({ summary: 'Consume a fulfilled hold for a member' })
  consumeHold(@Param('bookId') bookId: string, @Param('memberId') memberId: string) {
    return this.appService.consumeHold(bookId, memberId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update reservation status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.appService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a reservation' })
  cancelReservation(@Param('id') id: string) {
    return this.appService.remove(id);
  }
}
