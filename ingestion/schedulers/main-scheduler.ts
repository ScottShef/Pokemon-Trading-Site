// Main Scheduler for Pokemon Trading Site Data Ingestion
// This scheduler manages different ingestion tasks and schedules

import cron from 'node-cron';
import dotenv from 'dotenv';
import { main as ingestCards } from '../pokemon-cards/ingest-cards.js';

dotenv.config();

interface ScheduledTask {
  name: string;
  schedule: string;
  task: () => Promise<void>;
  enabled: boolean;
}

class IngestionScheduler {
  private tasks: ScheduledTask[] = [];

  constructor() {
    this.initializeTasks();
  }

  private initializeTasks() {
    // Daily Pokemon card data sync at 2 AM
    this.addTask({
      name: 'Daily Pokemon Card Sync',
      schedule: '0 2 * * *', // Every day at 2 AM
      task: ingestCards,
      enabled: process.env.ENABLE_DAILY_SYNC === 'true'
    });

    // Weekly full data refresh on Sundays at 1 AM
    this.addTask({
      name: 'Weekly Full Data Refresh',
      schedule: '0 1 * * 0', // Every Sunday at 1 AM
      task: this.fullDataRefresh.bind(this),
      enabled: process.env.ENABLE_WEEKLY_REFRESH === 'true'
    });

    // Price update every 6 hours
    this.addTask({
      name: 'Price Update',
      schedule: '0 */6 * * *', // Every 6 hours
      task: this.priceUpdate.bind(this),
      enabled: process.env.ENABLE_PRICE_UPDATES === 'true'
    });
  }

  addTask(task: ScheduledTask) {
    this.tasks.push(task);
  }

  start() {
    console.log('Starting ingestion scheduler...');
    
    this.tasks.forEach(task => {
      if (task.enabled) {
        console.log(`Scheduling task: ${task.name} with schedule: ${task.schedule}`);
        cron.schedule(task.schedule, async () => {
          console.log(`Starting scheduled task: ${task.name}`);
          try {
            await task.task();
            console.log(`Completed scheduled task: ${task.name}`);
          } catch (error) {
            console.error(`Error in scheduled task ${task.name}:`, error);
          }
        });
      } else {
        console.log(`Task disabled: ${task.name}`);
      }
    });

    console.log('Scheduler started successfully!');
  }

  private async fullDataRefresh() {
    console.log('Starting full data refresh...');
    // This could involve clearing old data and re-ingesting everything
    await ingestCards();
    console.log('Full data refresh completed');
  }

  private async priceUpdate() {
    console.log('Starting price update...');
    // This could be a lighter version that only updates prices
    // For now, we'll just run the full ingestion
    await ingestCards();
    console.log('Price update completed');
  }

  stop() {
    console.log('Stopping all scheduled tasks...');
    cron.getTasks().forEach(task => task.destroy());
    console.log('All tasks stopped');
  }
}

// Main execution
async function main() {
  const scheduler = new IngestionScheduler();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
  });

  scheduler.start();
  
  // Keep the process running
  console.log('Scheduler is running. Press Ctrl+C to stop.');
}

if (require.main === module) {
  main();
}

export { IngestionScheduler };
