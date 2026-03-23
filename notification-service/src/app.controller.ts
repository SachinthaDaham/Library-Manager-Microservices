import { Controller, Get, Put, Delete, Param } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Notifications (Subscriber)')
@Controller('notifications')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('book.overdue')
  async handleBookOverdue(@Payload() data: any) {
    console.log(`[Event Received] Book Overdue: Sending penalty email to member: ${data.memberId}`);
    return this.appService.notifyOverdue(data);
  }

  @EventPattern('book.returned')
  async handleBookReturned(@Payload() data: any) {
    console.log(`[Event Received] Book Returned: Sending resolution email to member: ${data.memberId}`);
    return this.appService.notifyReturn(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notification logs' })
  getNotifications() {
    return this.appService.getAll();
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string) {
    return this.appService.markAsRead(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  deleteNotification(@Param('id') id: string) {
    return this.appService.remove(id);
  }
}
