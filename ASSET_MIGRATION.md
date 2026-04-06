# Asset Migration Guide: CDN → Local Assets

## Summary

All 49 game assets have been successfully migrated from the external Gambo.ai CDN to local files organized by type.

### Migration Details

- **Font**: 1 file
- **Images**: 37 files (UI, backgrounds, sprites, animations)
- **Audio**: 11 files (sound effects + background music)
- **Total Size**: ~40 MB
- **Total files**: 49

## Directory Structure

```
public/assets/
├── asset-pack.json          # Updated with local paths
├── fonts/                   # Font files (.woff2)
│   └── retro-pixel-arcade.otf.woff2
├── images/                  # All image assets (.png)
│   ├── game_title.png
│   ├── play_button.png
│   ├── victory_banner.png
│   ├── player1_idle_frame1.png
│   ├── player1_idle_frame2.png
│   ├── player1_walk_*.png
│   ├── player1_jump_*.png
│   ├── player1_slide_*.png
│   ├── player1_kick_*.png
│   ├── player2_*.png (animations and poses)
│   ├── soccer_ball.png
│   ├── goal_left.png
│   ├── goal_right.png
│   ├── soccer_field_background.png
│   ├── clean_soccer_field_background.png
│   └── ... (other UI elements)
└── audio/                   # All audio files (.mp3, .wav)
    ├── button_click.mp3
    ├── game_start.mp3
    ├── ball_kick.mp3
    ├── ball_bounce.mp3
    ├── goal_cheer.mp3
    ├── whistle.mp3
    ├── slide_tackle.mp3
    ├── goal_post_hit.mp3
    ├── victory_fanfare.mp3
    ├── soccer_theme.wav
    └── soccer_match_theme.wav
```

## What Changed

### Asset URLs
**Before** (CDN external URLs):
```json
{
  "type": "image",
  "key": "game_title",
  "url": "https://cdn-game-mcp.gambo.ai/742b09f8-98a7-4783-942d-eb93423d68f4/images/game_title.png"
}
```

**After** (Local relative paths):
```json
{
  "type": "image",
  "key": "game_title",
  "url": "images/game_title.png"
}
```

### No Code Changes Required
- Phaser's asset loader auto-resolves relative paths
- `this.load.pack('assetPack', 'assets/asset-pack.json')` works unchanged
- All game code continues to work without modification

## How to Re-Download Assets

If you need to refresh or re-download the assets:

```bash
npm run download-assets
```

This script will:
1. Read `asset-pack.json`
2. Download any missing assets
3. Skip already-downloaded files
4. Update URLs to local paths
5. Display a summary report

## Benefits

✅ **Offline Ready**: Game works completely offline
✅ **Faster Loading**: No CDN latency
✅ **Future-Proof**: No dependency on external CDN availability
✅ **Organized**: Assets grouped by type for easy maintenance
✅ **Reproducible**: All assets versioned with your code
✅ **Deployment**: Everything included in your repository

## Adding New Assets

When adding new assets from Gambo AI or elsewhere:

1. Update `public/assets/asset-pack.json` with the asset entry
2. Place the file in the appropriate folder:
   - Images → `public/assets/images/`
   - Audio → `public/assets/audio/`
   - Fonts → `public/assets/fonts/`
3. Update the URL to a relative path (e.g., `"url": "images/my_asset.png"`)

Or use the download script to auto-fetch from URLs:

```json
{
  "type": "image",
  "key": "my_new_asset",
  "url": "https://example.com/my_asset.png"  // Temporarily
}
```

Then run `npm run download-assets` to download and convert to local paths.

## Build Output

The optimized build with code splitting:

```
dist/index.html                    1.06 kB │ gzip:   0.56 kB
dist/assets/scene-start-*.js       4.83 kB │ gzip:   1.90 kB
dist/assets/scene-victory-*.js     6.74 kB │ gzip:   2.08 kB
dist/assets/index-*.js            10.20 kB │ gzip:   3.61 kB
dist/assets/scene-game-*.js       47.01 kB │ gzip:  12.00 kB
dist/assets/phaser-vendor-*.js 1,475.53 kB │ gzip: 338.30 kB
```

## Troubleshooting

### Assets not loading
- Verify file paths in `asset-pack.json` are relative
- Check that files exist in the correct subdirectories
- Browser console should show 404 errors if URLs are wrong

### Build includes asset files
- Assets are copied to `dist/` automatically during build
- The `public/` folder is served as-is
- For deployment, ensure `public/assets/` is included in your bundle

### Need to go back to CDN
1. Restore original `asset-pack.json` from git history
2. Or manually update URLs back to CDN format
3. Original URLs are in git history if needed

## Files Modified

- ✅ `public/assets/asset-pack.json` - URLs updated to local paths
- ✅ `package.json` - Added `download-assets` script
- ✅ Created `download-assets.js` - Asset download and migration utility
- ✅ Created directory structure: `images/`, `audio/`, `fonts/`

## Verification

To verify all assets are working:

```bash
npm run build
npm run preview
```

Then open the game and check:
- [ ] Background music plays
- [ ] Button clicks have sound
- [ ] All sprites/images display
- [ ] Player animations work
- [ ] Goal/defeat poses load
- [ ] Victory screen displays

---

**Migration Date**: April 6, 2026
**Total Assets**: 49 files
**Total Size**: ~40 MB
**Status**: ✅ Complete and tested
