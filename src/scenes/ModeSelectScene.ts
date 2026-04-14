import Phaser from "phaser"
import { screenSize, audioConfig } from "../gameConfig.json"

export default class ModeSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: "ModeSelectScene" })
  }

  create() {
    console.log("🎮 ModeSelectScene created")
    
    const centerX = screenSize.width.value / 2
    const centerY = screenSize.height.value / 2

    // Background
    this.add.image(centerX, centerY, 'clean_soccer_field_background')
      .setDisplaySize(screenSize.width.value, screenSize.height.value)
      .setAlpha(0.4)

    // Dark overlay
    this.add.rectangle(centerX, centerY, screenSize.width.value, screenSize.height.value, 0x000000, 0.5)

    // Title
    this.add.text(centerX, centerY - 207, 'SELECT GAME MODE', {
      fontSize: '50px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#ff6b35',
      strokeThickness: 4.5,
      align: 'center'
    }).setOrigin(0.5, 0.5)

    // Player vs Player Option
    this.createModeOption(
      centerX - 150,
      centerY,
      'player_blue_front',
      'vs',
      'player_red_front',
      'Player vs Player',
      '#00ff00',
      'pvp'
    )

    // Player vs AI Option
    this.createModeOption(
      centerX + 150,
      centerY,
      'player_blue_front',
      'vs',
      'player_red_front',
      'Player vs AI',
      '#ffaa00',
      'pva'
    )

    // Back button
    const backButton = this.add.image(91, 60, 'back_button')
      .setScale(0.4)
      .setInteractive({ useHandCursor: true })

    backButton.on('pointerover', () => {
      backButton.setScale(0.22)
      if (this.sound.get('button_click')) {
        this.sound.play('button_click', { volume: audioConfig.sfxVolume.value })
      }
    })

    backButton.on('pointerout', () => {
      backButton.setScale(0.2)
    })

    backButton.on('pointerdown', () => {
      console.log("⬅️ Going back to LandingScene")
      this.scene.start('LandingScene')
    })

    // Instructions
    this.add.text(centerX, centerY + 193, 'Choose your opponent and start playing!', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0.5)
  }

  private createModeOption(
    x: number,
    y: number,
    player1Sprite: string,
    vsText: string,
    player2Sprite: string,
    label: string,
    labelColor: string,
    mode: 'pvp' | 'pva'
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    
    // Neon color selection
    const neonColor = mode === 'pvp' ? 0x00ffff : 0xffaa00 // Cyan for PvP, Orange for PvAI
    const neonColorHex = mode === 'pvp' ? '#00ffff' : '#ffaa00'
    const boxWidth = 240
    const boxHeight = 280
    
    // Create a container for the neon border effect
    const borderContainer = this.add.graphics()
    borderContainer.setPosition(x, y - 42)
    
    // Draw main neon border - stroke only
    borderContainer.lineStyle(3, neonColor, 1.0)
    borderContainer.strokeRoundedRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, 15)
    
    // Draw outer glow layer (slightly larger)
    const glowGraphics1 = this.add.graphics()
    glowGraphics1.lineStyle(6, neonColor, 0.4)
    glowGraphics1.strokeRoundedRect(x - boxWidth/2 - 3, y - boxHeight/2 - 3 - 42, boxWidth + 6, boxHeight + 6, 15)
    
    // Draw another glow layer
    const glowGraphics2 = this.add.graphics()
    glowGraphics2.lineStyle(10, neonColor, 0.2)
    glowGraphics2.strokeRoundedRect(x - boxWidth/2 - 6, y - boxHeight/2 - 6 - 42, boxWidth + 12, boxHeight + 12, 15)
    
    // Animate glow
    this.tweens.add({
      targets: [glowGraphics1, glowGraphics2],
      alpha: { from: 0.2, to: 0.8 },
      duration: 1200,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.inOut'
    })
    
    // Animate border brightness
    this.tweens.add({
      targets: borderContainer,
      alpha: { from: 0.8, to: 1.0 },
      duration: 800,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.inOut'
    })

    // Background box (dark)
    const box = this.add.rectangle(0, 0, boxWidth - 6, boxHeight - 6, 0x0a0a2e, 0.95)
    box.setStrokeStyle(1, neonColor)
    box.setAlpha(0.8)
    container.add(box)

    // Player 1
    const player1 = this.add.image(-40, -40, player1Sprite)
      .setScale(0.4)
    container.add(player1)

    // VS text with strong neon effect
    const vs = this.add.text(0, 20, vsText, {
      fontSize: '36px',
      fontFamily: 'Arial Black, sans-serif',
      color: neonColorHex,
      stroke: neonColorHex,
      strokeThickness: 4,
      shadow: { 
        offsetX: 0, 
        offsetY: 0, 
        color: neonColorHex, 
        blur: 15, 
        fill: true,
        stroke: true
      }
    }).setOrigin(0.5, 0.5)
    container.add(vs)

    // AI or Player 2
    const player2 = this.add.image(40, -40, mode === 'pvp' ? player2Sprite : 'player_red_front')
      .setScale(0.4)
    if (mode === 'pva') {
      player2.setTint(0xff0000)
    }
    container.add(player2)

    // Mode label with strong neon glow
    const modeLabel = this.add.text(0, 80, label, {
      fontSize: '24px',
      fontFamily: 'Arial Black, sans-serif',
      color: neonColorHex,
      align: 'center',
      stroke: neonColorHex,
      strokeThickness: 2,
      shadow: { 
        offsetX: 0, 
        offsetY: 0, 
        color: neonColorHex, 
        blur: 12, 
        fill: true,
        stroke: true
      }
    }).setOrigin(0.5, 0.5)
    container.add(modeLabel)

    // AI indicator for PvA
    if (mode === 'pva') {
      const aiLabel = this.add.text(0, 110, '🤖 AI OPPONENT', {
        fontSize: '14px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ff00ff',
        stroke: '#ff00ff',
        strokeThickness: 2,
        shadow: { 
          offsetX: 0, 
          offsetY: 0, 
          color: '#ff00ff', 
          blur: 8, 
          fill: true 
        }
      }).setOrigin(0.5, 0.5)
      container.add(aiLabel)
    }

    // Start button with neon style
    const startBtn = this.add.text(0, 150, 'START GAME', {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#000000',
      backgroundColor: neonColorHex,
      padding: { x: 20, y: 12 },
      stroke: neonColorHex,
      strokeThickness: 2,
      shadow: { 
        offsetX: 0, 
        offsetY: 0, 
        color: neonColorHex, 
        blur: 8, 
        fill: true 
      }
    }).setOrigin(0.5, 0.5)
    startBtn.setInteractive({ useHandCursor: true })
    container.add(startBtn)

    // Button animations
    startBtn.on('pointerover', () => {
      startBtn.setScale(1.12)
      startBtn.setBackgroundColor(neonColorHex)
      startBtn.setColor('#000000')
      if (this.sound.get('button_click')) {
        this.sound.play('button_click', { volume: audioConfig.sfxVolume.value })
      }
    })

    startBtn.on('pointerout', () => {
      startBtn.setScale(1)
      startBtn.setBackgroundColor(neonColorHex)
      startBtn.setColor('#000000')
    })

    startBtn.on('pointerdown', () => {
      console.log(`🎮 Starting game: ${mode === 'pvp' ? 'Player vs Player' : 'Player vs AI'}`)
      this.registry.set('gameMode', mode)
      this.scene.start('GameScene')
    })

    // Make container interactive
    container.setInteractive()

    return container
  }

  shutdown() {
    // Stop any music if needed
    this.sound.stopAll()
  }
}
