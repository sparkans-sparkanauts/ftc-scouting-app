# FTC Scouting Application - File Structure

```
ftc-scouting-app/
│
├── 📁 app/                          # Next.js App Router
│   ├── 📄 layout.tsx                # Root layout with metadata
│   ├── 📄 page.tsx                  # Home page - Team list & search
│   ├── 🎨 globals.css               # Global styles & cyber theme
│   │
│   └── 📁 team/                     # Dynamic team routes
│       └── 📁 [number]/             # Team detail pages
│           └── 📄 page.tsx          # Individual team scouting page
│
├── 📁 components/                   # Reusable React components
│   ├── 📄 AdminSettings.tsx         # API credentials management UI
│   └── 📄 DrawingCanvas.tsx         # Interactive Konva canvas
│
├── 📁 lib/                          # Core utilities & services
│   ├── 📄 ftc-api.ts               # FTC API integration & auth
│   └── 📄 storage.ts               # localStorage persistence
│
├── 📁 public/                       # Static assets (empty, for images)
│
├── 📄 package.json                  # Dependencies & scripts
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 tailwind.config.js            # Tailwind CSS theming
├── 📄 postcss.config.js             # PostCSS setup
├── 📄 next.config.js                # Next.js configuration
├── 📄 .gitignore                    # Git ignore rules
│
├── 📖 README.md                     # Full documentation
└── 📖 QUICKSTART.md                 # Quick setup guide
```

## Key Files Explained

### Core Application Files

#### `app/layout.tsx`
Root layout wrapper for the entire application. Sets metadata and imports global styles.

#### `app/page.tsx` ⭐ HOME PAGE
Main dashboard featuring:
- Searchable team table
- Statistics cards (total teams, rankings, avg OPR)
- Click-to-navigate team rows
- Responsive design with animations

#### `app/team/[number]/page.tsx` ⭐ TEAM DETAIL PAGE
Dynamic route for individual team scouting:
- Team information display
- Interactive drawing canvas
- Notes editor with auto-save
- Statistics sidebar

### Components

#### `components/AdminSettings.tsx` 🔐
Modal interface for API credentials:
- Username & auth key input
- Show/hide password toggle
- Real-time credential validation
- localStorage persistence
- Security warnings

#### `components/DrawingCanvas.tsx` 🎨
Interactive scouting canvas:
- Konva-based drawing surface
- Multi-color pen tool
- Eraser functionality
- Undo/redo history
- Background image import
- PNG export
- Grid overlay
- Touch support for tablets

### Library Files

#### `lib/ftc-api.ts` 🔌 API SERVICE
FTC API integration:
- `encodeCredentials()` - Base64 encoding for Basic Auth
- `getStoredCredentials()` - Retrieve from localStorage
- `saveCredentials()` - Store credentials locally
- `fetchTeams()` - Get team list for event
- `fetchRankings()` - Get rankings with OPR
- `fetchTeamsWithRankings()` - Merged data
- `validateCredentials()` - Test API connection

**Endpoints Used:**
- `GET /teams?eventCode=CAABCMP`
- `GET /rankings/CAABCMP`

#### `lib/storage.ts` 💾 STORAGE UTILITY
localStorage management for scouting data:
- `getTeamScoutingData()` - Load team notes & drawings
- `saveTeamScoutingData()` - Persist scouting data
- `deleteTeamScoutingData()` - Remove team data
- `exportScoutingData()` - Export as JSON
- `importScoutingData()` - Import from JSON
- `clearAllScoutingData()` - Reset all data

**Storage Keys:**
- `ftc_api_credentials` - API username & auth key
- `ftc_scouting_data` - All team scouting data

### Configuration Files

#### `package.json`
Dependencies:
- `next` - Framework
- `react` & `react-dom` - UI library
- `react-konva` & `konva` - Canvas drawing
- `lucide-react` - Icons
- `typescript` - Type safety
- `tailwindcss` - Styling

#### `tailwind.config.js`
Custom cyber theme:
- Dark color palette (cyber-blue, cyber-purple, etc.)
- Custom fonts (Orbitron, JetBrains Mono)
- Animation utilities
- Glow effects

#### `tsconfig.json`
TypeScript configuration with:
- Strict type checking
- Path aliases (`@/*`)
- Next.js plugin

### Styling

#### `app/globals.css`
Global styles featuring:
- Tailwind imports
- Custom CSS classes (cyber-card, cyber-button, etc.)
- Grid background patterns
- Scrollbar styling
- Animation keyframes
- Glow effects

## Data Flow

### Home Page Flow
```
User visits / 
  → app/page.tsx loads
  → Fetches credentials from localStorage (lib/storage.ts)
  → Calls fetchTeamsWithRankings() (lib/ftc-api.ts)
  → Displays team table with search
  → User clicks team → Navigate to /team/[number]
```

### Team Page Flow
```
User visits /team/123
  → app/team/[number]/page.tsx loads
  → Fetches team data from API
  → Loads scouting data from localStorage
  → Displays canvas + notes
  → User draws/writes
  → Auto-saves to localStorage
```

### Admin Settings Flow
```
User clicks Admin button
  → components/AdminSettings.tsx modal opens
  → User enters credentials
  → validateCredentials() checks API (lib/ftc-api.ts)
  → saveCredentials() stores in localStorage
  → Page refreshes to fetch data
```

## Component Hierarchy

```
RootLayout (app/layout.tsx)
│
├─ HomePage (app/page.tsx)
│  ├─ AdminSettings
│  ├─ Stats Cards
│  ├─ Search Bar
│  └─ Team Table
│
└─ TeamPage (app/team/[number]/page.tsx)
   ├─ Header with Back Button
   ├─ Team Info Card
   ├─ DrawingCanvas
   │  ├─ Toolbar (colors, tools)
   │  ├─ Konva Stage
   │  └─ Export/Import buttons
   └─ Notes Sidebar
      ├─ Textarea
      ├─ Save Button
      └─ Stats Card
```

## Storage Structure

### localStorage Keys

**`ftc_api_credentials`**
```json
{
  "username": "your-username",
  "authKey": "your-auth-key"
}
```

**`ftc_scouting_data`**
```json
{
  "12345": {
    "teamNumber": 12345,
    "notes": "Strong autonomous...",
    "drawingDataURL": "data:image/png;base64,...",
    "lastModified": "2026-02-15T10:30:00.000Z"
  },
  "67890": {
    "teamNumber": 67890,
    "notes": "Excellent defense...",
    "drawingDataURL": "data:image/png;base64,...",
    "lastModified": "2026-02-15T11:15:00.000Z"
  }
}
```

## API Integration

### Authentication
```typescript
// Encode credentials
const encoded = btoa(`${username}:${authKey}`);

// Add to headers
headers: {
  'Authorization': `Basic ${encoded}`,
  'Content-Type': 'application/json'
}
```

### Request Flow
```
Frontend                    FTC API
   |                           |
   |--- GET /teams ----------->|
   |<-- Team List -------------|
   |                           |
   |--- GET /rankings -------->|
   |<-- Rankings + OPR --------|
   |                           |
   |-- Merge Data in Frontend -|
```

## Styling System

### Color Palette
- `cyber-dark`: #0a0e17 (Card background)
- `cyber-darker`: #060811 (Page background)
- `cyber-blue`: #00d9ff (Primary accent)
- `cyber-purple`: #b026ff (OPR stats)
- `cyber-pink`: #ff2d95 (Losses, highlights)
- `cyber-green`: #00ff88 (Wins, success)
- `cyber-yellow`: #ffdd00 (Rank 1)

### Typography
- Display: Orbitron (headings, numbers)
- Body: Inter (paragraphs, UI)
- Mono: JetBrains Mono (stats, code)

### Custom Classes
- `.cyber-card` - Dark card with border
- `.cyber-button` - Primary action button
- `.cyber-button-secondary` - Secondary button
- `.cyber-input` - Form input field
- `.cyber-table` - Data table styling
- `.glow-text` - Text shadow effect

## Build & Deploy

### Development
```bash
npm run dev     # Start dev server on :3000
```

### Production
```bash
npm run build   # Create optimized build
npm start       # Serve production build
```

### Environment
- Node.js 18+
- No environment variables needed
- All config in localStorage

## Security Notes

- ✅ API credentials stored client-side only
- ✅ No server-side credential storage
- ✅ Direct HTTPS to FTC API
- ✅ No third-party data transmission
- ⚠️ localStorage is device-specific (not synced)
- ⚠️ Clear browser data will erase credentials
