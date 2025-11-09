# 🏆 Daily Pet Competition Feature

Complete implementation of a daily pet competition system with token economy, voting mechanism, and automated prize distribution.

## Overview

Users can enter their pets into a daily competition by paying an entry fee. Other users vote for their favorite pets, and at the end of the day, the top 3 pets with the most votes win prizes from the accumulated prize pool.

## Features

### Core Functionality

- ✅ Daily pet competitions (24-hour cycle)
- ✅ Token-based entry fees
- ✅ User voting system with device fingerprinting
- ✅ Automated prize distribution (50%, 30%, 20%)
- ✅ Entry cancellation with full refund
- ✅ Real-time leaderboard updates
- ✅ Previous winners hall of fame
- ✅ Entry sharing functionality

### Security Features

- ✅ One vote per device per competition
- ✅ Device fingerprinting (SHA256 hash)
- ✅ Vote fraud detection
- ✅ Secure token transactions
- ✅ Entry cancellation time limits

### User Experience

- ✅ Professional Binance-style UI with golden yellow theme
- ✅ Gradient headers and smooth animations
- ✅ Grid/List view toggle for entries
- ✅ Real-time vote count updates
- ✅ Pull-to-refresh on all screens
- ✅ Loading states and error handling
- ✅ Share functionality for entries

## Tech Stack

### Backend

- **Framework**: Express.js v4.19.2
- **Database**: MongoDB with Mongoose v8.3.4
- **Validation**: Zod v3.23.8
- **File Upload**: Multer with AWS S3
- **Cron Jobs**: node-cron (for automated tasks)

### Frontend

- **Framework**: React Native v0.80.1
- **Navigation**: React Navigation v7
- **State Management**: Zustand + TanStack Query v5.28.5
- **Styling**: NativeWind v4.1.23 (Tailwind CSS)
- **Icons**: react-native-vector-icons
- **Image Picker**: react-native-image-picker
- **Secure Storage**: react-native-keychain

## API Endpoints

### Public Endpoints

#### Get Current Competitions

```http
GET /api/competitions/current
```

Returns active and upcoming competitions with user's entry status.

**Response:**

```json
{
  "success": true,
  "data": {
    "active": {
      "_id": "...",
      "date": "2024-01-15",
      "status": "active",
      "entryFee": 100,
      "prizePool": 5000,
      "totalEntries": 50,
      "totalVotes": 342,
      "startTime": "2024-01-15T00:00:00.000Z",
      "endTime": "2024-01-15T23:59:59.999Z"
    },
    "upcoming": { ... },
    "userEntry": { ... }
  }
}
```

#### Get Competition Details

```http
GET /api/competitions/:competitionId/details?page=1&limit=20
```

**Response:**

```json
{
  "success": true,
  "data": {
    "competition": { ... },
    "entries": [
      {
        "_id": "...",
        "petName": "Max",
        "photoUrl": "https://...",
        "votesCount": 45,
        "rank": 1,
        "userId": {
          "fullName": "John Doe",
          "username": "johndoe"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalEntries": 50,
      "hasMore": true
    }
  }
}
```

#### Get Leaderboard

```http
GET /api/competitions/:competitionId/leaderboard
```

Returns top entries sorted by votes.

#### Get Previous Winners

```http
GET /api/competitions/previous-winners
```

Returns the most recent completed competition with winners.

#### Get Past Competitions

```http
GET /api/competitions/past?page=1&limit=10
```

Returns historical competitions.

### Protected Endpoints (Require Authentication)

#### Submit Entry

```http
POST /api/competitions/:competitionId/entry
Authorization: Bearer <token>

{
  "petName": "Max",
  "description": "The cutest golden retriever!",
  "photoUrl": "https://..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Entry submitted successfully",
  "data": {
    "_id": "...",
    "petName": "Max",
    "votesCount": 0,
    "entryFeePaid": 100
  }
}
```

#### Vote for Entry

```http
POST /api/competitions/:competitionId/vote
Authorization: Bearer <token>

{
  "entryId": "...",
  "deviceInfo": {
    "deviceId": "unique-device-uuid",
    "deviceModel": "iPhone 14",
    "osVersion": "17.0",
    "platform": "ios"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "data": {
    "votesCount": 46
  }
}
```

#### Cancel Entry

```http
DELETE /api/competitions/:competitionId/entry
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Entry cancelled and refund processed",
  "data": {
    "refundedAmount": 100
  }
}
```

#### Get My Entry

```http
GET /api/competitions/:competitionId/my-entry
Authorization: Bearer <token>
```

Returns user's entry with current rank.

## Database Models

### Competition Model

```javascript
{
  date: Date,                    // Competition date (YYYY-MM-DD)
  status: String,                // 'upcoming' | 'active' | 'completed' | 'cancelled'
  entryFee: Number,              // Default: 100 tokens
  prizePool: Number,             // Accumulated from entries
  startTime: Date,               // 00:00 UTC
  endTime: Date,                 // 23:59 UTC
  entryStartTime: Date,          // Same as startTime
  entryEndTime: Date,            // 1 hour before endTime
  totalEntries: Number,
  totalVotes: Number,
  winners: {
    first: { entryId, userId, votes, prize },
    second: { entryId, userId, votes, prize },
    third: { entryId, userId, votes, prize }
  },
  prizesDistributed: Boolean
}
```

### CompetitionEntry Model

```javascript
{
  competitionId: ObjectId,
  userId: ObjectId,
  petName: String,
  description: String,
  photoUrl: String,
  status: String,                // 'active' | 'cancelled'
  votesCount: Number,
  entryFeePaid: Number,
  refunded: Boolean,
  refundedAt: Date
}
```

### CompetitionVote Model

```javascript
{
  competitionId: ObjectId,
  entryId: ObjectId,
  userId: ObjectId,
  deviceFingerprint: String,     // SHA256 hash
  deviceInfo: {
    deviceId: String,
    deviceModel: String,
    osVersion: String,
    platform: String
  },
  ipAddress: String,
  isValid: Boolean,
  flaggedForReview: Boolean
}
```

## Frontend Screens

### 1. CompetitionHomeScreen

**Route**: `Competition` → `CompetitionHome`

**Features:**

- Previous winners showcase
- Active competition card with prize pool
- Upcoming competition preview
- "Enter Now" and "View Entries" buttons
- Pull-to-refresh

### 2. CompetitionDetailsScreen

**Route**: `CompetitionDetails`

**Features:**

- Grid/List view toggle
- Entry cards with photos and vote counts
- Leaderboard with top 3 medals
- Vote buttons (disabled if already voted)
- Pagination support
- Real-time vote updates

### 3. EntryFormScreen

**Route**: `EntryForm`

**Features:**

- Photo upload with react-native-image-picker
- Pet name input (required)
- Description input (optional)
- Token balance display
- Entry fee confirmation
- Form validation

### 4. MyEntryScreen

**Route**: `MyEntry`

**Features:**

- Full-size pet photo
- Current vote count
- Current rank display
- Share entry button
- Cancel entry button (with refund info)
- Entry fee paid display

### 5. PreviousWinnersScreen

**Route**: `PreviousWinners`

**Features:**

- Hall of Fame display
- Medal badges for top 3
- Winner cards with photos
- Prize amounts
- Competition dates
- Pull-to-refresh

### 6. EntryDetailsScreen

**Route**: `EntryDetails` (Modal)

**Features:**

- Full-screen pet photo
- Owner information
- Pet name and description
- Vote count and rank
- Vote button (if not voted)
- Share button
- Entry timestamp

## Navigation Structure

```
TabNavigator
├── Home
├── Market
├── [Add Button]
├── Competition (NEW)
│   └── CompetitionNavigator
│       ├── CompetitionHome
│       ├── CompetitionDetails
│       ├── EntryForm
│       ├── MyEntry
│       ├── PreviousWinners
│       └── EntryDetails (Modal)
└── Profile
```

## Token Economy

### Entry Fee

- **Default**: 100 tokens per entry
- **Refundable**: Yes (if cancelled before 1 hour to end)
- **Transaction Type**: `competition_entry`

### Prize Distribution

1. **1st Place**: 50% of prize pool
2. **2nd Place**: 30% of prize pool
3. **3rd Place**: 20% of prize pool

**Example:**

- 50 entries × 100 tokens = 5,000 tokens prize pool
- 1st: 2,500 tokens
- 2nd: 1,500 tokens
- 3rd: 1,000 tokens

### Transaction Types

```javascript
// In tokenTransaction.model.js
type: {
  type: String,
  enum: [
    'purchase',
    'reward',
    'transfer',
    'competition_entry',      // NEW
    'competition_refund',      // NEW
    'competition_prize',       // NEW
    // ... other types
  ]
}
```

## Voting System

### Device Fingerprinting

Each vote is tracked using a SHA256 hash of:

```javascript
const fingerprint = crypto
  .createHash("sha256")
  .update(`${deviceId}-${deviceModel}-${platform}`)
  .digest("hex");
```

### Device ID Generation

Uses `react-native-keychain` to store a persistent UUID:

```typescript
// Android & iOS
const uuid = await Keychain.getGenericPassword({ service: "device-uuid" });
if (!uuid) {
  const newUuid = generateUUID();
  await Keychain.setGenericPassword("device-uuid", newUuid, {
    service: "device-uuid",
  });
}
```

### Vote Validation

- ✅ One vote per device per competition
- ✅ Must be authenticated user
- ✅ Cannot vote for own entry
- ✅ Competition must be active
- ✅ Device fingerprint stored and checked

## Automated Tasks (Cron Jobs)

### Daily Competition Creation

**Schedule**: 00:00 UTC  
**Cron**: `0 0 * * *`

Creates a new competition for the current day.

### Winner Selection & Prize Distribution

**Schedule**: 23:59 UTC  
**Cron**: `59 23 * * *`

- Ends active competition
- Selects top 3 winners
- Distributes prizes
- Updates competition status to 'completed'

### Tomorrow's Competition Creation

**Schedule**: 01:00 UTC  
**Cron**: `0 1 * * *`

Pre-creates tomorrow's competition in 'upcoming' status.

### Status Updates (Optional)

**Schedule**: Every 5 minutes  
**Cron**: `*/5 * * * *`

Updates competition statuses based on current time.

See [COMPETITION_CRON_JOBS.md](./COMPETITION_CRON_JOBS.md) for detailed setup.

## File Structure

### Backend

```
petoye_backend/
├── src/
│   ├── models/
│   │   ├── competition.model.js
│   │   ├── competitionEntry.model.js
│   │   ├── competitionVote.model.js
│   │   └── tokenTransaction.model.js (updated)
│   ├── controllers/
│   │   └── competitionController.js
│   ├── routes/
│   │   └── competitionRoute.js
│   ├── validation/
│   │   └── competitionValidation.js
│   ├── helpers/
│   │   └── competitionHelper.js
│   └── app.js (updated)
├── scripts/
│   └── cronJobs.js (new)
└── docs/
    └── COMPETITION_CRON_JOBS.md
```

### Frontend

```
App/petoye/src/
├── screens/
│   └── competition/
│       ├── CompetitionHomeScreen.tsx
│       ├── CompetitionDetailsScreen.tsx
│       ├── EntryFormScreen.tsx
│       ├── MyEntryScreen.tsx
│       ├── PreviousWinnersScreen.tsx
│       └── EntryDetailsScreen.tsx
├── api/
│   └── competitions/
│       ├── types/
│       │   └── types.ts
│       ├── routes/
│       │   └── competitions.ts
│       ├── queries/
│       │   └── useCompetitionQueries.ts
│       └── mutations/
│           └── useCompetitionMutations.ts
├── navigation/
│   ├── TabNavigator.tsx (updated)
│   └── stacks/
│       └── CompetitionNavigator.tsx
├── components/
│   └── navigation/
│       └── CustomTabBar.tsx (updated)
└── utils/
    └── deviceInfo.ts
```

## Setup Instructions

### Backend Setup

1. **Install dependencies**:

```bash
cd petoye_backend
npm install node-cron
```

2. **Register routes** (already done in `src/app.js`):

```javascript
app.use("/api/competitions", competitionRoute);
```

3. **Start cron jobs** (add to `src/app.js`):

```javascript
require("../scripts/cronJobs");
```

4. **Run server**:

```bash
npm run dev
```

### Frontend Setup

1. **Install dependencies** (already in package.json):

```bash
cd App/petoye
npm install
```

2. **Build and run**:

```bash
# iOS
npm run ios

# Android
npm run android
```

## Testing

### Manual API Testing

Use the provided Postman collection or test manually:

```bash
# Get current competitions
curl http://localhost:3000/api/competitions/current

# Submit entry (requires auth)
curl -X POST http://localhost:3000/api/competitions/<id>/entry \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "petName": "Max",
    "description": "Cute dog!",
    "photoUrl": "https://..."
  }'

# Vote for entry
curl -X POST http://localhost:3000/api/competitions/<id>/vote \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "entryId": "...",
    "deviceInfo": {
      "deviceId": "test-uuid",
      "deviceModel": "Test",
      "platform": "ios"
    }
  }'
```

### Manual Cron Testing

```javascript
// In Node REPL
const {
  createDailyCompetition,
  endCompetitionAndSelectWinners,
} = require("./src/helpers/competitionHelper");

// Test creation
await createDailyCompetition();

// Test winner selection
await endCompetitionAndSelectWinners();
```

## Monitoring

### Backend Logs

```bash
# Development
npm run dev

# Production
pm2 logs petoye-api
pm2 logs petoye-cron
```

### Database Queries

```javascript
// Check active competitions
db.competitions.find({ status: "active" });

// Check entries for a competition
db.competitionentries.find({ competitionId: ObjectId("...") });

// Check votes
db.competitionvotes.find({ competitionId: ObjectId("...") });
```

## Troubleshooting

### Common Issues

1. **Votes not counting**:

   - Check device fingerprint is being sent
   - Verify user hasn't voted before
   - Check competition is active

2. **Entry submission failing**:

   - Verify user has enough tokens
   - Check competition is accepting entries
   - Validate photo URL is accessible

3. **Cron jobs not running**:

   - Check `cronJobs.js` is imported in `app.js`
   - Verify server timezone matches cron schedule
   - Check logs for error messages

4. **Prizes not distributed**:
   - Check competition has entries
   - Verify `endCompetitionAndSelectWinners()` ran
   - Check transaction logs

## Future Enhancements

- [ ] Push notifications for competition results
- [ ] Special themed competitions (e.g., "Cutest Puppy")
- [ ] Multiple competitions per day
- [ ] User rankings and badges
- [ ] Entry comments/reactions
- [ ] Video entry support
- [ ] Sponsored competitions with boosted prizes
- [ ] Entry draft/save functionality
- [ ] Advanced fraud detection with ML

## License

This feature is part of the Petoye platform.

## Support

For issues or questions, contact the development team.
