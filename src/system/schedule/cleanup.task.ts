import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CleanupTask {
  @Cron(CronExpression.EVERY_DAY_AT_2PM)
  handleCron() {
    console.log('Running hourly cleanup task...');
    // logic to clear expired sessions, etc.
  }
}
// can dynamically start and stop through registry
