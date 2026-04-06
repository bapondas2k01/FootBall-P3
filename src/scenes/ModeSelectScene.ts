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
    this.add.text(centerX, centerY - 180, 'SELECT GAME MODE', {
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
    this.add.text(centerX, centerY + 180, 'Choose your opponent and start playing!', {
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
    
    // Background box
    const box = this.add.rectangle(0, 0, 220, 260, 0x1a1a1a, 0.8)
    box.setStrokeStyle(3, 0xff6b35)
    container.add(box)

    // Player 1
    const player1 = this.add.image(-40, -40, player1Sprite)
      .setScale(0.4)
    container.add(player1)

    // VS text
    const vs = this.add.text(0, 20, vsText, {
      fontSize: '32px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ff6b35',
      stroke: '#ffffff',
      strokeThickness: 2
    }).setOrigin(0.5, 0.5)
    container.add(vs)

    // AI or Player 2
    const player2 = this.add.image(40, -40, mode === 'pvp' ? player2Sprite : 'player_red_front')
      .setScale(0.4)
    if (mode === 'pva') {
      player2.setTint(0xff0000) // Red tint for AI
    }
    container.add(player2)

    // Mode label
    const modeLabel = this.add.text(0, 80, label, {
      fontSize: '20px',
      fontFamily: 'Arial Black, sans-serif',
      color: labelColor,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    container.add(modeLabel)

    // AI indicator
    if (mode === 'pva') {
      const aiLabel = this.add.text(0, 110, '🤖 AI Opponent', {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#ff0000'
      }).setOrigin(0.5, 0.5)
      container.add(aiLabel)
    }

    // Start button
    const startBtn = this.add.text(0, 150, 'START GAME', {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#000000',
      backgroundColor: labelColor,
      padding: { x: 15, y: 10 }
    }).setOrigin(0.5, 0.5)
    startBtn.setInteractive({ useHandCursor: true })
    container.add(startBtn)

    startBtn.on('pointerover', () => {
      startBtn.setScale(1.1)
      if (this.sound.get('button_click')) {
        this.sound.play('button_click', { volume: audioConfig.sfxVolume.value })
      }
    })

    startBtn.on('pointerout', () => {
      startBtn.setScale(1)
    })

    startBtn.on('pointerdown', () => {
      console.log(`🎮 Starting game: ${mode === 'pvp' ? 'Player vs Player' : 'Player vs AI'}`)
      // Store game mode for GameScene to use
      this.registry.set('gameMode', mode)
      this.scene.start('GameScene')
    })

    // Make entire container interactive
    container.setInteractive()

    return container
  }

  shutdown() {
    // Stop any music if needed
    this.sound.stopAll()
  }
}
