# FTC DECODE Scouting Application

A high-tech, cyber-themed scouting application for the FTC 2026 DECODE Season, specifically built for the Alberta Championship (Event Code: CAABCMP).

## Features

### 🔐 Secure API Integration
- Base64-encoded Basic Authentication for FTC API
- Credentials stored locally in browser localStorage
- Admin settings panel for easy credential management
- Real-time credential validation

### 📊 Team Dashboard
- Searchable table of all teams at the event
- Live rankings with W-L-T records
- OPR (Offensive Power Rating) calculations
- Responsive design with dark mode cyber aesthetic

### 🎨 Interactive Scouting Canvas
- HTML5 Canvas powered by react-konva
- Draw autonomous routes in alliance colors (Red/Blue)
- Multiple drawing colors and tools
- Eraser and undo/redo functionality
- Background image import for field layouts
- Export drawings as PNG images
- Auto-save to localStorage

### 📝 Team Notes
- Rich text notes for each team
- Sidebar interface for observations and strategies
- Persistent storage indexed by team number
- Character counter and auto-save

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom cyber theme
- **Canvas:** react-konva / Konva.js
- **Icons:** lucide-react
- **Data Storage:** Browser localStorage

## Installation

1. **Clone or create the project directory:**
```bash
mkdir ftc-scouting-app
cd ftc-scouting-app
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to `http://localhost:3000`

## Configuration

### Setting Up API Credentials

1. Click the **Admin** button in the top-right corner
2. Enter your FTC API credentials:
   - **Username:** Your FTC API username
   - **Auth Key:** Your FTC API authorization key
3. Click **Save Credentials** to validate and store them
4. The app will automatically fetch team data

Your credentials are stored securely in your browser's localStorage and are only sent to the official FTC API.

### Getting FTC API Credentials

1. Register at [FIRST Inspires](https://ftc-events.firstinspires.org/)
2. Navigate to the API documentation
3. Generate your API credentials
4. Use these credentials in the Admin settings

## Project Structure

```
ftc-scouting-app/
├── app/
│   ├── globals.css           # Global styles with cyber theme
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page with team table
│   └── team/
│       └── [number]/
│           └── page.tsx      # Team detail page
├── components/
│   ├── AdminSettings.tsx     # API credentials management
│   └── DrawingCanvas.tsx     # Interactive canvas component
├── lib/
│   ├── ftc-api.ts           # FTC API service
│   └── storage.ts           # localStorage utilities
├── public/                   # Static assets
├── package.json             # Dependencies
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── next.config.js          # Next.js configuration
```

## Key Files

### API Service (`lib/ftc-api.ts`)

Handles all FTC API interactions:
- Base64 credential encoding
- Team and ranking data fetching
- Credential validation
- localStorage credential management

Key functions:
- `encodeCredentials()` - Encodes username and auth key
- `fetchTeams()` - Retrieves team list
- `fetchRankings()` - Retrieves rankings with OPR
- `fetchTeamsWithRankings()` - Merges team and ranking data
- `validateCredentials()` - Tests API credentials

### Storage Utility (`lib/storage.ts`)

Manages scouting data persistence:
- Stores drawings as base64 DataURLs
- Stores notes as plain text
- Indexed by team number
- Export/import functionality

Key functions:
- `getTeamScoutingData()` - Retrieves team scouting data
- `saveTeamScoutingData()` - Saves drawing and notes
- `exportScoutingData()` - Exports all data as JSON
- `importScoutingData()` - Imports scouting data

### Team Detail Page (`app/team/[number]/page.tsx`)

Dynamic route for individual team pages featuring:
- Team information and statistics
- Interactive drawing canvas
- Notes editor
- Auto-save functionality

## Usage

### Viewing Teams

1. The home page displays all teams in a searchable table
2. Search by team number or name
3. Click any team row to view details

### Scouting a Team

1. Click on a team to open the detail page
2. Use the drawing canvas to map autonomous routes:
   - Select Red or Blue alliance colors
   - Draw paths on the field
   - Use the eraser to correct mistakes
   - Import a field image as background
3. Add notes in the sidebar:
   - Record observations
   - Note strengths and weaknesses
   - Document alliance strategies
4. Click "Save Notes" or let auto-save handle it

### Drawing Tools

- **Pen:** Draw routes and paths
- **Eraser:** Remove unwanted lines
- **Colors:** 6 alliance and indicator colors
- **Size:** Adjustable stroke width (1-10)
- **Undo/Redo:** Step through drawing history
- **Clear:** Reset the entire canvas
- **Export:** Download as PNG image
- **Import Background:** Load field layout image

## API Endpoints

The application connects to:
- `GET /teams?eventCode=CAABCMP` - Team list
- `GET /rankings/CAABCMP` - Rankings with OPR

Base URL: `https://ftc-api.firstinspires.org/v2.0/2026/`

## Styling

The application uses a custom cyber-themed design system:
- **Primary:** Cyan blue (#00d9ff)
- **Secondary:** Purple (#b026ff)
- **Accent:** Pink (#ff2d95)
- **Background:** Dark navy (#0a0e17)
- **Font:** Orbitron (display), Inter (body), JetBrains Mono (code)

## Data Persistence

All scouting data is stored in browser localStorage:
- **API Credentials:** `ftc_api_credentials`
- **Scouting Data:** `ftc_scouting_data`

Data persists between sessions and is device-specific.

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Canvas features require HTML5 Canvas API support.

## Performance

- Optimized bundle size with dynamic imports
- Responsive canvas sizing
- Lazy loading for heavy components
- Efficient React rendering with useMemo

## Security

- API credentials stored in localStorage only
- No server-side credential storage
- Direct communication with FTC API
- No third-party data sharing

## Future Enhancements

Potential features for future versions:
- Match schedule integration
- Alliance selection helper
- Multi-event support
- Team comparison tools
- Data export to CSV/PDF
- Collaborative scouting
- Mobile app version

## Troubleshooting

### API Connection Issues
- Verify credentials in Admin settings
- Check internet connection
- Ensure FTC API is accessible
- Try the "Validate Credentials" button

### Canvas Not Loading
- Ensure JavaScript is enabled
- Try a different browser
- Clear browser cache
- Check console for errors

### Data Not Saving
- Check localStorage isn't disabled
- Verify browser storage limits
- Try clearing and re-entering data
- Check browser console for errors

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify API credentials are correct
3. Ensure the event code (CAABCMP) is valid
4. Test with a different browser

## License

Built for FTC teams participating in the 2026 DECODE season.

## Acknowledgments

- FIRST® Tech Challenge for the API
- Next.js team for the framework
- Konva.js for canvas functionality
- Tailwind CSS for styling utilities
