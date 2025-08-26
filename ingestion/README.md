# Pokemon Trading Site - Data Ingestion Suite

This folder contains all data ingestion tools, schedulers, and utilities for the Pokemon Trading Site.

## Structure

```
ingestion/
├── pokemon-cards/          # Pokemon card data ingestion
│   └── ingest-cards.ts     # Main card ingestion script
├── schedulers/             # Automated scheduling tools
│   └── main-scheduler.ts   # Main scheduler for automated tasks
├── scripts/                # Utility scripts
│   ├── check-status.ts     # Database status checker
│   └── cleanup-db.ts       # Database cleanup utility
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Prerequisites

1. **Environment Variables**: Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

## Available Scripts

### Data Ingestion
- `npm run ingest:cards` - Run Pokemon card data ingestion
- `npm run ingest:cards:dev` - Run with development environment variables

### Scheduling
- `npm run scheduler:start` - Start the automated scheduler
- `npm run scheduler:dev` - Start scheduler in development mode with auto-reload

### Database Utilities
- `npm run db:status` - Check database statistics and status
- `npm run db:cleanup` - Clean up old data and optimize database

### Development
- `npm run dev` - Run card ingestion in watch mode
- `npm run dev:status` - Run status checker in watch mode
- `npm run build` - Build all TypeScript files

## Environment Variables

Required environment variables (add to `.env`):

```env
# Turso Database
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Pokemon Price Tracker API
POKEMON_PRICE_API_KEY=your-api-key
POKEMON_PRICE_API_URL=https://api.pokemontcg.io/v2

# Scheduler Settings (optional)
ENABLE_DAILY_SYNC=true
ENABLE_WEEKLY_REFRESH=true
ENABLE_PRICE_UPDATES=true
```

## Usage Examples

### One-time Data Ingestion
```bash
# Ingest all Pokemon card data
npm run ingest:cards
```

### Check Database Status
```bash
# See current database statistics
npm run db:status
```

### Start Automated Scheduler
```bash
# Run scheduled tasks (daily sync, weekly refresh, etc.)
npm run scheduler:start
```

### Database Maintenance
```bash
# Clean up old data and optimize database
npm run db:cleanup
```

## Scheduling

The scheduler supports multiple automated tasks:

- **Daily Pokemon Card Sync**: Updates card data daily at 2 AM
- **Weekly Full Data Refresh**: Complete data refresh every Sunday at 1 AM
- **Price Updates**: Updates pricing data every 6 hours

Configure scheduling by setting environment variables:
- `ENABLE_DAILY_SYNC=true`
- `ENABLE_WEEKLY_REFRESH=true`
- `ENABLE_PRICE_UPDATES=true`

## API Rate Limits

The Pokemon Price Tracker API has the following limits:
- **Free Tier**: 200 requests per day
- **Rate Limit**: 60 requests per minute

The ingestion script automatically handles rate limiting with appropriate delays.

## Adding New Ingestion Types

To add new types of data ingestion:

1. Create a new folder under `ingestion/` (e.g., `market-data/`)
2. Add your ingestion script(s)
3. Update `package.json` with new scripts
4. Add scheduling tasks to `schedulers/main-scheduler.ts` if needed

## Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure your Pokemon Price Tracker API key is valid and has sufficient quota
2. **Database Connection**: Verify your Turso database URL and auth token
3. **Rate Limiting**: If you hit API limits, the script will automatically retry with delays

### Debugging

Run scripts in development mode for more verbose output:
```bash
npm run ingest:cards:dev
npm run scheduler:dev
```

### Database Issues

Check database status and clean up if needed:
```bash
npm run db:status
npm run db:cleanup
```

## Contributing

When adding new ingestion scripts:
1. Follow the existing TypeScript patterns
2. Add appropriate error handling
3. Include rate limiting for external APIs
4. Update this README with new functionality
5. Add relevant npm scripts to `package.json`
