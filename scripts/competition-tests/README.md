# Competition Testing Scripts

This folder contains individual testing scripts for the pet competition system. Each script handles a specific operation.

## 📁 Available Scripts

### 1. Create Today's Competition

```bash
node scripts/competition-tests/1-create-today.js
```

- Creates a competition for the current day
- Sets up start/end times and entry windows
- Entry fee: 10 tokens (configurable)
- Initial prize pool: 0 tokens

### 2. Create Tomorrow's Competition

```bash
node scripts/competition-tests/2-create-tomorrow.js
```

- Creates a competition for tomorrow
- Status: "upcoming"
- Users can start submitting entries 1 hour before competition starts

### 3. Add Sample Entries

```bash
node scripts/competition-tests/3-add-sample-entries.js
```

- Adds sample pet entries to the active competition
- Creates random votes for each entry (5-25 votes)
- Automatically adds tokens to users if needed
- Updates prize pool based on entry fees

### 4. End Competition

```bash
node scripts/competition-tests/4-end-competition.js
```

- Ends the active competition
- Selects top 3 winners by vote count
- Distributes prizes based on number of entries:
  - **1 entry**: 🥇 100% of prize pool
  - **2 entries**: 🥇 67% / 🥈 33%
  - **3+ entries**: 🥇 50% / 🥈 30% / 🥉 20%
- Updates user token balances
- Shows winner details

### 5. View All Competitions

```bash
node scripts/competition-tests/5-view-all.js
```

- Lists all competitions in the database
- Shows competition status (active/upcoming/completed)
- Displays winners for completed competitions
- Shows top 3 for active competitions
- Provides overall statistics

### 6. Update Competition Statuses

```bash
node scripts/competition-tests/6-update-statuses.js
```

- Updates competition statuses based on current time
- Activates upcoming competitions that should start
- Shows status changes
- Lists active and upcoming competitions

### 7. Full Test Flow

```bash
node scripts/competition-tests/7-full-test.js
```

- Runs complete end-to-end test
- Creates today's competition
- Adds sample entries with votes
- Ends competition and distributes prizes
- Creates tomorrow's competition
- **Use this for quick comprehensive testing**

### 8. Comprehensive Test Suite ⭐ NEW

```bash
node scripts/competition-tests/8-comprehensive-test.js
```

- **RECOMMENDED FOR COMPLETE VALIDATION**
- Tests all prize distribution scenarios:
  - ✅ 1 Entry: 100% winner
  - ✅ 2 Entries: 67% / 33% split
  - ✅ 3 Entries: 50% / 30% / 20% split
  - ✅ 5 Entries: Top 3 win (50% / 30% / 20%)
  - ✅ Tie Scenario: First submitted wins
- Automatic validation of expected vs actual prizes
- Clean pass/fail reporting
- **Use this to verify all edge cases**

## 🎯 Typical Test Workflow

### Quick Test (Full Flow)

```bash
# Run everything at once
node scripts/competition-tests/7-full-test.js
```

### Complete Validation (All Edge Cases) ⭐ RECOMMENDED

```bash
# Test all prize distribution scenarios
node scripts/competition-tests/8-comprehensive-test.js
```

### Step-by-Step Test

```bash
# Step 1: Create competition
node scripts/competition-tests/1-create-today.js

# Step 2: Add entries and votes
node scripts/competition-tests/3-add-sample-entries.js

# Step 3: View current state
node scripts/competition-tests/5-view-all.js

# Step 4: End competition
node scripts/competition-tests/4-end-competition.js

# Step 5: Create next competition
node scripts/competition-tests/2-create-tomorrow.js
```

## 📊 What Each Script Tests

### Competition Creation

- ✅ Competition document creation
- ✅ Date/time settings
- ✅ Status management (active/upcoming)
- ✅ Entry window configuration

### Entry Management

- ✅ Entry fee deduction
- ✅ Prize pool accumulation
- ✅ Entry validation
- ✅ Photo URL handling

### Voting System

- ✅ Vote creation
- ✅ Device fingerprinting
- ✅ Vote counting
- ✅ Duplicate prevention

### Prize Distribution

- ✅ Winner selection (top 3)
- ✅ Prize calculation:
  - **1 entry**: 100% to winner
  - **2 entries**: 67% / 33%
  - **3+ entries**: 50% / 30% / 20%
- ✅ Token transaction recording
- ✅ User balance updates
- ✅ Competition completion status
- ✅ Tie-breaking (earlier submission wins)

## 🔧 Prerequisites

Before running these scripts, ensure:

1. **MongoDB is running**

   ```bash
   # Check connection in .env
   MONGO_URL=mongodb://localhost:27017/petoye
   ```

2. **At least 3 users exist in database**

   - Scripts need users to create entries
   - Scripts will auto-add tokens if needed

3. **Environment variables are set**
   - Make sure `.env` file exists in project root

## 📝 Sample Output

### Running Full Test:

```
🚀 Full Competition Test Flow
============================================================

📅 STEP 1: Creating Today's Competition
------------------------------------------------------------
✅ Competition created: 2025-11-08
  Prize Pool: 0 tokens
  Entry Fee: 10 tokens

🎨 STEP 2: Adding Sample Entries with Votes
------------------------------------------------------------
Found 8 users

✅ Max by @john_doe
✅ Luna by @jane_smith
✅ Charlie by @bob_wilson
...

📊 Adding votes...
  Max: 18 votes
  Luna: 15 votes
  Charlie: 22 votes
...

✅ Created 8 entries with 142 total votes
  Prize Pool: 80 tokens

🏆 Current Leaderboard:
  🥇 Charlie by @bob_wilson - 22 votes
  🥈 Max by @john_doe - 18 votes
  🥉 Luna by @jane_smith - 15 votes

🏁 STEP 3: Ending Competition and Distributing Prizes
------------------------------------------------------------
✅ Competition ended!

🏆 WINNERS:
🥇 FIRST: Charlie by @bob_wilson
   Votes: 22
   Prize: 40 tokens
   New Balance: 140 tokens

🥈 SECOND: Max by @john_doe
   Votes: 18
   Prize: 24 tokens
   New Balance: 124 tokens

🥉 THIRD: Luna by @jane_smith
   Votes: 15
   Prize: 16 tokens
   New Balance: 116 tokens

✅ FULL TEST COMPLETED SUCCESSFULLY!
```

## 🐛 Troubleshooting

### "No active competition found"

```bash
# Create one first
node scripts/competition-tests/1-create-today.js
```

### "Need at least 3 users"

- Add users via your API or admin panel
- Or modify scripts to reduce user requirement

### "Competition already exists"

- Scripts will use existing competition
- Or delete it manually and try again

### MongoDB connection error

- Check if MongoDB is running
- Verify MONGO_URL in .env file

## 💡 Tips

- Run `5-view-all.js` frequently to see current state
- Use `7-full-test.js` for quick comprehensive testing
- Individual scripts are better for debugging specific issues
- Check MongoDB collections directly: `competitions`, `competitionentries`, `competitionvotes`

## 🔗 Related Files

- **Helper Functions**: `src/helpers/competitionHelper.js`
- **Models**: `src/models/competition.model.js`, `src/models/competitionEntry.model.js`
- **Controllers**: `src/controllers/competitionController.js`
- **Routes**: `src/routes/competitionRoute.js`

## 📚 Next Steps

After testing:

1. Set up cron jobs for production (see `docs/COMPETITION_CRON_JOBS.md`)
2. Test the frontend competition screens
3. Verify vote duplicate prevention on real devices
4. Monitor prize distribution transactions

## 🤝 Need Help?

If you encounter issues:

1. Check MongoDB logs
2. Review script output for error messages
3. Verify database state with `5-view-all.js`
4. Check user token balances
