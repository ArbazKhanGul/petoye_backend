# Competition Cron Jobs Setup

This document describes the automated cron jobs required for the daily pet competition system.

## Overview

The competition system requires three automated tasks to run daily:

1. **Create Daily Competition** - Creates a new competition at midnight
2. **End Competition & Select Winners** - Finalizes competition and distributes prizes
3. **Create Tomorrow's Competition** - Pre-creates the next day's competition

## Required Jobs

### 1. Create Daily Competition

**Schedule**: Every day at 00:00 UTC (midnight)  
**Cron Expression**: `0 0 * * *`

Creates a new active competition for the current day.

```javascript
// File: petoye_backend/scripts/cronJobs.js
const cron = require("node-cron");
const { createDailyCompetition } = require("../src/helpers/competitionHelper");

// Run at 00:00 UTC daily
cron.schedule("0 0 * * *", async () => {
  console.log("🎯 Running daily competition creation job...");
  try {
    await createDailyCompetition();
    console.log("✅ Daily competition created successfully");
  } catch (error) {
    console.error("❌ Error creating daily competition:", error);
  }
});
```

### 2. End Competition & Select Winners

**Schedule**: Every day at 23:59 UTC (1 minute before midnight)  
**Cron Expression**: `59 23 * * *`

Ends the current competition, selects winners, and distributes prizes.

```javascript
const {
  endCompetitionAndSelectWinners,
} = require("../src/helpers/competitionHelper");

// Run at 23:59 UTC daily
cron.schedule("59 23 * * *", async () => {
  console.log("🏆 Running competition winner selection job...");
  try {
    await endCompetitionAndSelectWinners();
    console.log("✅ Winners selected and prizes distributed");
  } catch (error) {
    console.error("❌ Error selecting winners:", error);
  }
});
```

### 3. Create Tomorrow's Competition

**Schedule**: Every day at 01:00 UTC (1 hour after midnight)  
**Cron Expression**: `0 1 * * *`

Pre-creates tomorrow's competition in "upcoming" status.

```javascript
// Run at 01:00 UTC daily
cron.schedule("0 1 * * *", async () => {
  console.log("📅 Running tomorrow's competition creation job...");
  try {
    await createTomorrowCompetition();
    console.log("✅ Tomorrow's competition created");
  } catch (error) {
    console.error("❌ Error creating tomorrow's competition:", error);
  }
});
```

### 4. Update Competition Statuses (Optional)

**Schedule**: Every 5 minutes  
**Cron Expression**: `*/5 * * * *`

Updates competition statuses based on current time (handles edge cases).

```javascript
const {
  updateCompetitionStatuses,
} = require("../src/helpers/competitionHelper");

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("🔄 Running competition status update job...");
  try {
    await updateCompetitionStatuses();
    console.log("✅ Competition statuses updated");
  } catch (error) {
    console.error("❌ Error updating competition statuses:", error);
  }
});
```

## Implementation

### Step 1: Install Dependencies

```bash
cd petoye_backend
npm install node-cron
```

### Step 2: Create Cron Jobs File

Create `petoye_backend/scripts/cronJobs.js`:

```javascript
const cron = require("node-cron");
const {
  createDailyCompetition,
  endCompetitionAndSelectWinners,
  createTomorrowCompetition,
  updateCompetitionStatuses,
} = require("../src/helpers/competitionHelper");

console.log("🚀 Starting competition cron jobs...");

// 1. Create daily competition at midnight (00:00 UTC)
cron.schedule("0 0 * * *", async () => {
  console.log("🎯 Running daily competition creation job...");
  try {
    await createDailyCompetition();
    console.log("✅ Daily competition created successfully");
  } catch (error) {
    console.error("❌ Error creating daily competition:", error);
  }
});

// 2. End competition and select winners at 23:59 UTC
cron.schedule("59 23 * * *", async () => {
  console.log("🏆 Running competition winner selection job...");
  try {
    await endCompetitionAndSelectWinners();
    console.log("✅ Winners selected and prizes distributed");
  } catch (error) {
    console.error("❌ Error selecting winners:", error);
  }
});

// 3. Create tomorrow's competition at 01:00 UTC
cron.schedule("0 1 * * *", async () => {
  console.log("📅 Running tomorrow's competition creation job...");
  try {
    await createTomorrowCompetition();
    console.log("✅ Tomorrow's competition created");
  } catch (error) {
    console.error("❌ Error creating tomorrow's competition:", error);
  }
});

// 4. Update competition statuses every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("🔄 Running competition status update job...");
  try {
    await updateCompetitionStatuses();
  } catch (error) {
    console.error("❌ Error updating competition statuses:", error);
  }
});

console.log("✅ All competition cron jobs scheduled");

module.exports = cron;
```

### Step 3: Integrate with App

Update `petoye_backend/src/app.js` to start cron jobs:

```javascript
// Import cron jobs
require("../scripts/cronJobs");
```

Add this line after all imports but before routes setup.

### Step 4: Update package.json Scripts

Add a dedicated script to run with cron jobs:

```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "cron": "node scripts/cronJobs.js"
  }
}
```

## Production Deployment

### Option 1: Single Process (Recommended for Small Scale)

The cron jobs run automatically when the app starts. No additional setup needed.

### Option 2: Separate Process (Recommended for Large Scale)

Run cron jobs in a separate process:

```bash
# Terminal 1 - Main app
npm start

# Terminal 2 - Cron jobs only
npm run cron
```

### Option 3: PM2 Ecosystem (Production)

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "petoye-api",
      script: "./src/app.js",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "petoye-cron",
      script: "./scripts/cronJobs.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
```

## Monitoring

### Check Cron Job Status

```javascript
// Add to cronJobs.js for monitoring
const activeJobs = cron.getTasks();
console.log(`📊 Active cron jobs: ${activeJobs.size}`);
```

### Logging

All cron jobs log their execution:

- ✅ Success logs
- ❌ Error logs with stack traces
- 🔄 Progress indicators

Monitor logs with:

```bash
# Development
npm run dev

# Production with PM2
pm2 logs petoye-cron
```

## Testing Cron Jobs Manually

You can test the helper functions manually without waiting for cron:

```javascript
// In node REPL or test script
const {
  createDailyCompetition,
  endCompetitionAndSelectWinners,
  createTomorrowCompetition,
  updateCompetitionStatuses,
} = require("./src/helpers/competitionHelper");

// Test creating competition
await createDailyCompetition();

// Test selecting winners
await endCompetitionAndSelectWinners();

// Test creating tomorrow's competition
await createTomorrowCompetition();

// Test updating statuses
await updateCompetitionStatuses();
```

## Timezone Considerations

All times are in **UTC**. If you need to adjust for a specific timezone:

```javascript
// Example: Run at midnight EST (UTC-5)
// Midnight EST = 5:00 AM UTC
cron.schedule("0 5 * * *", async () => {
  await createDailyCompetition();
});
```

## Troubleshooting

### Cron Jobs Not Running

1. **Check if cron is imported**: Ensure `require('../scripts/cronJobs')` is in `app.js`
2. **Check server timezone**: Run `date` command to verify server time
3. **Check cron syntax**: Use [crontab.guru](https://crontab.guru/) to validate expressions
4. **Check logs**: Look for error messages in console output

### Missed Executions

If the server was down during scheduled time:

- Run helper functions manually to catch up
- Check competition status and update manually if needed

### Duplicate Competitions

If you see duplicate competitions:

- Check if multiple cron processes are running
- Ensure only one instance of the app is running
- Add unique index on `date` field in Competition model

## Best Practices

1. **Always use UTC** for cron schedules
2. **Log every execution** for monitoring
3. **Handle errors gracefully** with try-catch
4. **Test in development** before production
5. **Monitor logs regularly** to catch issues early
6. **Use PM2 in production** for process management
7. **Set up alerts** for failed cron jobs

## Environment Variables (Optional)

Add to `.env` for configuration:

```env
# Competition Settings
COMPETITION_ENTRY_FEE=100
COMPETITION_DURATION_HOURS=24
COMPETITION_TIMEZONE=UTC

# Cron Settings
ENABLE_CRON_JOBS=true
CRON_COMPETITION_CREATE=0 0 * * *
CRON_COMPETITION_END=59 23 * * *
CRON_TOMORROW_CREATE=0 1 * * *
```

Use in cronJobs.js:

```javascript
if (process.env.ENABLE_CRON_JOBS === "true") {
  cron.schedule(process.env.CRON_COMPETITION_CREATE, createDailyCompetition);
  // ... other jobs
}
```
