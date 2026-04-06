# Football-P3

A dynamic football (soccer) game built with **Phaser 3**, **TypeScript**, and **Vite**. This interactive game features intelligent AI opponents, realistic physics, and engaging gameplay mechanics.

## 🎮 Features

- **Interactive Gameplay**: Play as a football player with smooth controls and realistic ball physics
- **AI Opponents**: Face intelligent AI controllers that adapt to your gameplay
- **Multiple Game Scenes**: Landing scene, mode selection, loading, gameplay, and victory screens
- **Optimized Performance**: Built with Vite for fast development and production builds
- **TypeScript Support**: Full TypeScript implementation for type-safe development
- **Asset Management**: Integrated local asset handling with audio, animations, and images

## 🛠️ Tech Stack

- **Game Engine**: [Phaser 3.87.0](https://phaser.io)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Plugins**: phaser3-rex-plugins

## 📋 Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The game will be available at `http://localhost:8080`

### 3. Build for Production

```bash
npm run build
```

The optimized build will be created in the `dist/` directory.

### 4. Preview Production Build

```bash
npm run preview
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot module replacement |
| `npm run build` | Build for production with optimizations |
| `npm run preview` | Preview the production build locally |
| `npm run download-assets` | Download external assets |
| `npm run integrate-assets` | Integrate local assets into the game |

## 📁 Project Structure

```
src/
├── main.ts                    # Application entry point
├── GameUI.ts                  # UI management
├── Player.ts                  # Player controller and mechanics
├── Ball.ts                    # Ball physics and interactions
├── Goal.ts                    # Goal detection and scoring
├── AIController.ts            # AI opponent logic
├── gameConfig.json            # Game configuration settings
└── scenes/                    # Game scenes
    ├── StartScene.ts          # Title/start screen
    ├── LandingScene.ts        # Landing page
    ├── LoadingScene.ts        # Asset loading
    ├── ModeSelectScene.ts     # Game mode selection
    ├── GameScene.ts           # Main gameplay scene
    └── VictoryScene.ts        # Victory/results screen

public/
├── assets/
│   ├── animations/            # Sprite animations
│   ├── audio/                 # Sound effects and music
│   ├── fonts/                 # Game fonts
│   └── images/                # Game graphics

vite.config.js                 # Vite configuration with chunk optimization
tsconfig.json                  # TypeScript configuration
package.json                   # Project dependencies and scripts
```

## 🎯 Game Controls

- **WASD** or **Arrow Keys**: Move player
- **Space**: Kick/jump
- **Mouse/Touch**: Aim and shoot (varies by scene)

## 🔧 Development Notes

### Asset Management

- Use `npm run download-assets` to fetch remote assets
- Use `npm run integrate-assets` to organize assets locally
- Refer to [ASSET_MIGRATION.md](./ASSET_MIGRATION.md) for detailed asset setup

### Build Optimization

The Vite configuration includes intelligent code splitting:
- **Phaser vendor bundle**: Separate chunk for the Phaser library
- **Scene-specific chunks**: Individual bundles for StartScene, GameScene, and VictoryScene
- Chunk size warning limit: 1500KB

### Project Reports

- [Game Completion Report](./GAME_COMPLETION_REPORT.md)
- [Asset Migration Guide](./ASSET_MIGRATION.md)

## 🐛 Troubleshooting

**Game not loading?**
- Clear browser cache and rebuild: `npm run build`
- Check browser console for errors
- Ensure all assets are properly integrated using `npm run integrate-assets`

**Performance issues?**
- Check that assets are optimized
- Verify chunk splitting is working in the Network tab of DevTools
- Review browser performance metrics during gameplay

## 📝 License

This project uses Phaser 3, which is licensed under the MIT License.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Enjoy the game!** ⚽
