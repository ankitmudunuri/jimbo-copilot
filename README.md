# Jimbo Copilot Extension

A Balatro-based VS Code extension

## Features

- **Authentic Jimbo Image**: Uses the actual Jimbo joker image from Balatro
- **Balatro Sound System**: Cycles through the same sound effects as in the game
- **Speech Bubbles**: Jimbo speaks when Copilot code is accepted, with encouraging messages for code additions of 5 lines or less and sarcastic quotes for additions of more than 5 lines.
- **Interactive**: Click Jimbo for random sarcastic quotes with sound effects
- **Visual Effects**: Animated speech bubbles with talking animations
- **Smart Detection**: Detects when Copilot suggestions are accepted
- **Intelligent Session Tracking**: Tracks entire Copilot sessions and shows quotes only at the end
- **Line Count Analysis**: Different responses based on how much code was added
- **Adaptive Personality**: Positive for small changes, sarcastic for large additions

## How It Works

The extension listens for:
1. Document changes that look like code insertions (detects Copilot suggestions)
2. Manual test commands for debugging

When Copilot code is accepted, Jimbo:
- Silently tracks the code additions in the background
- Counts the total lines of code added in the session
- Shows a quote only at the very end of the entire Copilot session (after 3 seconds of inactivity)
- Displays positive encouragement for small additions (under 5 lines)
- Shows sarcastic commentary for larger code additions (5+ lines)

## Setup Instructions

### 1. Install Dependencies & Compile
```bash
npm install
npm run compile
```

### 2. Add Media Files

**Required files in `media/` directory:**
- `jimbo.png` - The Jimbo joker image from Balatro
- `sound1.mp3` through `sound11.mp3` - The talking sound effects

### 3. Run the Extension
- Press `F5` in VS Code to open Extension Development Host
- Look for the ▶️ icon in the Activity Bar to open Jimbo's panel
- Or use Command Palette: "Open Jimbo Panel"

## Usage

1. Open the extension in VS Code (F5)
2. Look for the "Jimbo Copilot" icon in the Activity Bar (left sidebar)
3. Click it to open the Jimbo panel
4. Start coding and use GitHub Copilot suggestions
5. When you accept a suggestion (Tab key), watch Jimbo react!

## Customization

### Adding Real Media Files

Replace the placeholder files in the `media/` directory:
- `jimbo.png` - An actual image of Jimbo from Balatro
- `jimbovoices/voice*.mp3` - Sound effects to play when code is accepted

Then update the `getWebviewHtml()` method in `src/extension.ts` to use the actual image instead of the CSS-generated face.

### Modifying Messages

Edit the quotes in `media/quotes.json` to change what Jimbo says when code is accepted.

### Styling

Modify the CSS in the `getWebviewHtml()` method to change the appearance of Jimbo and speech bubbles.

## File Structure

```
├── .vscode/
│   ├── launch.json          # Debug configuration
│   └── tasks.json           # Build tasks
├── media/                   # Media files (images, sounds)
├── out/                     # Compiled JavaScript
├── src/
│   └── extension.ts         # Main extension code
├── package.json             # Extension manifest
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Contributing

Feel free to enhance this extension with:
- Better Copilot detection methods
- More interactive features
- Additional visual effects
- Sound effects
- Different character themes

## Troubleshooting

**Jimbo not appearing?**
- Make sure the extension is activated
- Check that the Activity Bar is visible (View > Appearance > Activity Bar)

**Not detecting Copilot?**
- The extension uses heuristics to detect code suggestions
- It works best with multi-line suggestions or suggestions containing common keywords

**Performance issues?**
- The extension only triggers on suggestion acceptance, not every keystroke
- Animations are lightweight CSS transitions

