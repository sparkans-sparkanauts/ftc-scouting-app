# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Configure API Credentials
1. Open http://localhost:3000
2. Click "Admin" button (top-right)
3. Enter your FTC API credentials
4. Click "Save Credentials"

## 📋 What You Need

- Node.js 18+ installed
- FTC API credentials (username + auth key)
- Modern web browser

## 🎯 First-Time Setup

### Getting FTC API Credentials

1. Visit https://ftc-events.firstinspires.org/
2. Create or log into your account
3. Navigate to API section
4. Generate credentials
5. Copy username and auth key

### Using the Application

**Home Page:**
- View all teams at CAABCMP
- Search by team number or name
- See rankings and OPR
- Click any team to scout

**Team Page:**
- Draw autonomous routes on canvas
- Use Red/Blue alliance colors
- Add scouting notes
- Everything auto-saves to localStorage

## 🎨 Drawing Tips

- **Red** = Red alliance routes
- **Blue** = Blue alliance routes  
- **Yellow/Green** = Scoring zones
- **Purple** = Special actions
- Upload a field image as background
- Export your drawings as PNG

## 💾 Data Storage

All data stored locally in your browser:
- API credentials
- Team scouting notes
- Canvas drawings

No account required, no cloud storage.

## 🔧 Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## ⚠️ Troubleshooting

**Can't connect to API?**
- Check credentials in Admin
- Verify internet connection
- Ensure FTC API is online

**Canvas not working?**
- Try Chrome/Firefox/Safari
- Enable JavaScript
- Clear browser cache

**Data not saving?**
- Check localStorage is enabled
- Verify storage isn't full
- Try incognito mode to test

## 🎓 Learning Resources

- **Next.js:** https://nextjs.org/docs
- **React Konva:** https://konvajs.org/docs/react/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **FTC API:** https://ftc-api.firstinspires.org/

## 📱 Keyboard Shortcuts

- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Y` / `Cmd+Y` - Redo
- `Ctrl+S` / `Cmd+S` - Save notes

## 🏆 Pro Tips

1. **Import Field Images:** Get the official DECODE field layout and import it as a background
2. **Color Code Routes:** Use consistent colors for different alliance strategies  
3. **Export Regularly:** Download PNG backups of your drawings
4. **Detailed Notes:** Include match numbers, opponent analysis, and alliance recommendations
5. **Quick Search:** Use team numbers for fastest navigation

## 📊 Understanding Stats

- **Rank:** Position in standings
- **W-L-T:** Wins-Losses-Ties record
- **OPR:** Offensive Power Rating (average points contributed)
- **QP:** Qualifying Points
- **RP:** Ranking Points

## Need Help?

Check the console (F12) for error messages and refer to the main README.md for detailed documentation.

Happy Scouting! 🤖
