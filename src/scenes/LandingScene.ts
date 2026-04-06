import Phaser from "phaser"
import { screenSize, audioConfig } from "../gameConfig.json"

export default class LandingScene extends Phaser.Scene {
  private backgroundMusic!: Phaser.Sound.BaseSound

  constructor() {
    super({ key: "LandingScene" })
  }

  create() {
    console.log("🎬 LandingScene created")
    
    const centerX = screenSize.width.value / 2
    const centerY = screenSize.height.value / 2

    // Background
    this.add.image(centerX, centerY, 'soccer_field_background')
      .setDisplaySize(screenSize.width.value, screenSize.height.value)
      .setAlpha(0.5)

    // Dark overlay
    const overlay = this.add.rectangle(centerX, centerY, screenSize.width.value, screenSize.height.value, 0x000000, 0.4)
    overlay.setDepth(0)

    // Game title
    this.add.image(centerX, centerY - 40, 'game_title')
      .setScale(0.8)
      .setDepth(10)

    // Subtitle text
    this.add.text(centerX, centerY - 20, 'ARCADE SOCCER', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#ff6b35',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(10)

    this.add.text(centerX, centerY + 40, 'Select Game Mode', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffff00',
      align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(10)

    // Play button - redirects to mode select
    const playButton = this.add.image(centerX, centerY + 140, 'play_button')
      .setScale(0.2)
      .setInteractive({ useHandCursor: true })
      .setDepth(10)

    playButton.on('pointerover', () => {
      playButton.setScale(0.22)
      if (this.sound.get('button_click')) {
        this.sound.play('button_click', { volume: audioConfig.sfxVolume.value })
      }
    })

    playButton.on('pointerout', () => {
      playButton.setScale(0.2)
    })

    playButton.on('pointerdown', () => {
      console.log("🎮 Transitioning to ModeSelectScene")
      this.scene.start('ModeSelectScene')
    })

    // Play background music
    const bgMusic = this.sound.play('soccer_theme', {
      loop: true,
      volume: audioConfig.musicVolume.value
    })
    if (bgMusic && typeof bgMusic !== 'boolean') {
      this.backgroundMusic = bgMusic
    }

    // Soccer ball floating animation (cosmetic)
    this.createFloatingSoccer()
  }

  private createFloatingSoccer(): void {
    const ball = this.add.image(100, 100, 'soccer_ball')
      .setScale(0.1)
      .setDepth(5)

    this.tweens.add({
      targets: ball,
      x: screenSize.width.value - 100,
      y: screenSize.height.value - 100,
      duration: 8000,
      ease: 'Sine.inOut',
      repeat: -1,
      yoyo: true
    })

    // Rotation animation
    this.tweens.add({
      targets: ball,
      rotation: Math.PI * 2,
      duration: 3000,
      repeat: -1
    })
  }

  shutdown() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop()
    }
  }
}
