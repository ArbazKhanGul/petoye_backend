# Competition Cron Jobs

## Overview

The backend automatically manages daily competitions through scheduled cron jobs. These jobs run every night to ensure smooth competition lifecycle management.

## Automated Jobs

### 1. Nightly Competition Job (23:59 UTC)

**Schedule**: Every day at 23:59 UTC (11:59 PM)  
**Cron Expression**: `59 23 * * *`

This job performs two critical tasks:

#### Task 1: End Current Competition & Select Winners

- Finds the active competition that should end
- Retrieves top 3 entries sorted by vote count
- Distributes prizes to winners based on prize pool:
  - 1st place: 50% of prize pool
  - 2nd place: 30% of prize pool
  - 3rd place: 20% of prize pool
- Updates winner entries with rank and prize amount
- Marks competition as `completed` and `prizesDistributed: true`

#### Task 2: Create Tomorrow's Competition

- Creates a new `upcoming` competition for the next day
- Sets competition date to tomorrow's date (YYYY-MM-DD)
- Configures times:
  - **Start Time**: 00:00 UTC tomorrow
  - **End Time**: 23:59 UTC tomorrow
  - **Entry Start**: 1 hour after creation (allows immediate entries)
  - **Entry End**: 1 hour before competition starts
- Sets entry fee and initializes prize pool

### 2. Competition Status Update Job (Hourly)

**Schedule**: Every hour at minute 0  
**Cron Expression**: `0 * * * *`

This job ensures competitions transition correctly:

- Activates `upcoming` competitions when their start time arrives
- Updates competition status from `upcoming` to `active`

## Implementation

### File: `src/jobs/competitionJobs.js`

```javascript
const cron = require("node-cron");
const {
  endCompetitionAndSelectWinners,
  createTomorrowCompetition,
  updateCompetitionStatuses,
} = require("../helpers/competitionHelper");

function initializeCompetitionJobs() {
  // Nightly job at 23:59 UTC
  cron.schedule(
    "59 23 * * *",
    async () => {
      await endCompetitionAndSelectWinners();
      await createTomorrowCompetition();
    },
    { timezone: "UTC" }
  );

  // Hourly status update
  cron.schedule(
    "0 * * * *",
    async () => {
      await updateCompetitionStatuses();
    },
    { timezone: "UTC" }
  );
}
```

### Initialization in `src/app.js`

The cron jobs are automatically initialized when the server starts:

```javascript
const { initializeCompetitionJobs } = require("./jobs/competitionJobs");

server.listen(process.env.PORT, () => {
  console.log("🚀 Server listening on port " + process.env.PORT);
  initializeCompetitionJobs();
});
```

## Testing

To test the cron job logic without waiting for scheduled execution:

```bash
# Test the nightly job logic
node scripts/test-cron-logic.js
```

This script will:

1. End the current active competition
2. Create tomorrow's competition
3. Display detailed results

## Logs

When the cron jobs run, you'll see output like:

```
⏰ Initializing competition cron jobs...
✅ Competition cron jobs initialized:
   - Nightly job (23:59 UTC): End competition + Create tomorrow's competition
   - Hourly job (every hour): Update competition statuses

🎯 Running nightly competition jobs...
⏰ Time: 2025-11-16T23:59:00.000Z
📊 Ending current competition and selecting winners...
✅ Competition 2025-11-16 ended successfully
🏆 Winners selected and prizes distributed
📅 Creating tomorrow's competition...
✅ Tomorrow's competition created for 2025-11-17
📝 Status: upcoming
✅ Nightly competition jobs completed successfully
```

## Competition Lifecycle

```
Day 1 (23:59 UTC)
├── End Day 1 competition
│   ├── Select top 3 winners
│   ├── Distribute prizes
│   └── Mark as completed
└── Create Day 2 competition
    ├── Status: upcoming
    ├── Entry window opens immediately
    └── Competition starts at 00:00 UTC Day 2

Day 2 (00:00 UTC - triggered by hourly job)
└── Activate Day 2 competition
    └── Status: upcoming → active

Day 2 (23:59 UTC)
└── Repeat cycle...
```

## Important Notes

1. **Timezone**: All cron jobs run in UTC timezone
2. **Entry Window**: Users can enter the next day's competition as soon as it's created (around 23:59 UTC)
3. **Prize Distribution**: Automated and instant when competition ends
4. **Error Handling**: Errors are logged but don't crash the server
5. **Duplicate Prevention**: Helper functions check if competition already exists before creating

## Manual Operations

If you need to manually trigger these operations:

```javascript
// In Node.js console or script
const {
  endCompetitionAndSelectWinners,
  createTomorrowCompetition,
} = require("./src/helpers/competitionHelper");

// End current competition
await endCompetitionAndSelectWinners();

// Create tomorrow's competition
await createTomorrowCompetition();
```

## Dependencies

- `node-cron`: ^3.0.3 - Cron job scheduling
- Helper functions in `src/helpers/competitionHelper.js`

## Monitoring

To ensure cron jobs are running properly:

1. Check server logs for cron job execution messages
2. Verify competitions are being created daily in database
3. Confirm winners are being selected and prizes distributed
4. Monitor for any error logs related to cron jobs
