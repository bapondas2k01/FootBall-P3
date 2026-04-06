import Phaser from "phaser"
import { screenSize } from "../gameConfig.json"

export default class LoadingScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics
  private loadingBox!: Phaser.GameObjects.Graphics
  private percentText!: Phaser.GameObjects.Text
  private assetText!: Phaser.GameObjects.Text
  private loadingComplete = false
  
  // Progress tracking for UI sync
  private currentProgress: number = 0

  constructor() {
    super({
      key: "LoadingScene",
    })
  }

  init() {
    console.log("🎮 LoadingScene initialized - Phaser engine ready")
    this.createInitializationScreen()
  }

  preload() {
    console.log("🔄 Loading Scene started")
    
    // Clear and create loading UI
    this.children.removeAll()
    this.createLoadingUI()
    console.log("🎯 Full loading UI created")
    
    // Set up loading progress events
    this.setupLoadingEvents()
    
    // Load all assets directly from asset pack
    this.loadAssetsDirectly()
  }

  create() {
    console.log("✅ Loading Scene created")
    if (this.loadingComplete) {
      console.log("🚀 Loading already complete, transitioning immediately")
      this.transitionToStartScene()
    }
  }

  private loadAssetsDirectly(): void {
    console.log("📦 Loading assets from asset pack...")
    
    // Fetch asset pack configuration
    fetch('assets/asset-pack.json')
      .then(response => response.json())
      .then(assetPack => {
        console.log("✅ Asset pack loaded:", assetPack)
        this.processAssetPack(assetPack)
      })
      .catch(error => {
        console.error("❌ Failed to load asset pack:", error)
        // Fallback: directly load critical assets
        this.loadCriticalAssets()
      })
  }

  private processAssetPack(assetPack: any): void {
    // Helper function to load asset
    const loadAsset = (category: string, fileObj: any) => {
      try {
        const { type, key, url } = fileObj
        
        if (!key || !url) {
          console.warn(`⚠️  Skipping invalid asset in ${category}:`, fileObj)
          return
        }

        // Log each asset being loaded
        console.log(`  Loading [${category}] ${key}: ${url}`)

        // Construct full path for asset
        const assetPath = `assets/${url}`

        switch (type) {
          case 'image':
            this.load.image(key, assetPath)
            break
          case 'audio':
            this.load.audio(key, assetPath)
            break
          case 'font':
            if (fileObj.fontType === 'opentype') {
              this.load.bitmapFont(key, assetPath)
            }
            break
          case 'animation_sequence':
            // Load animation frames
            if (fileObj.frames && Array.isArray(fileObj.frames)) {
              fileObj.frames.forEach((framePath: string, index: number) => {
                const frameKey = `${key}_frame_${index}`
                this.load.image(frameKey, `assets/${framePath}`)
              })
              console.log(`  ✓ Animation sequence '${key}' with ${fileObj.frames.length} frames`)
            }
            break
          default:
            console.warn(`⚠️  Unknown asset type: ${type}`)
        }
      } catch (error) {
        console.error(`❌ Error loading asset:`, error)
      }
    }

    // Iterate through all categories and load
    let totalAssets = 0
    for (const category in assetPack) {
      if (category === 'meta' || !assetPack[category]) continue
      
      const categoryData = assetPack[category]
      if (!categoryData.files || !Array.isArray(categoryData.files)) continue

      console.log(`\n📂 Category: ${category} (${categoryData.files.length} items)`)
      
      categoryData.files.forEach((fileObj: any) => {
        loadAsset(category, fileObj)
        totalAssets++
      })
    }

    console.log(`\n✅ Queued ${totalAssets} assets for loading`)
    // Start loading
    this.load.start()
  }

  private loadCriticalAssets(): void {
    console.log("⚠️  Loading critical assets only...")
    
    // Load essential assets manually
    this.load.image('game_title', 'assets/images/game_title.png')
    this.load.image('play_button', 'assets/images/play_button.png')
    this.load.image('soccer_ball', 'assets/images/soccer_ball.png')
    this.load.image('goal_left', 'assets/images/goal_left.png')
    this.load.image('goal_right', 'assets/images/goal_right.png')
    this.load.image('soccer_field_background', 'assets/images/soccer_field_background.png')
    this.load.audio('soccer_theme', 'assets/audio/soccer_theme.wav')
    this.load.audio('ball_kick', 'assets/audio/ball_kick.mp3')
    
    console.log("⚠️  Critical assets queued")
    this.load.start()
  }

  private createInitializationScreen(): void {
    const centerX = screenSize.width.value / 2
    const centerY = screenSize.height.value / 2

    this.add.graphics().fillStyle(0x000000, 1).fillRect(0, 0, screenSize.width.value, screenSize.height.value)
    
    this.add.text(centerX, centerY, 'ARCADE SOCCER\nInitializing...', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#ff6b35',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5)
  }

  private createLoadingUI(): void {
    const centerX = screenSize.width.value / 2
    const centerY = screenSize.height.value / 2

    this.createGradientBackground()
    this.createFloatingFootballs()
    
    this.add.text(centerX, centerY - 180, 'ARCADE SOCCER', {
      fontSize: '56px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#ff6b35',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5, 0.5)

    this.add.text(centerX, centerY - 120, 'Loading Game Assets...', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif', 
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0.5)

    // Loading bar background
    this.loadingBox = this.add.graphics()
    this.loadingBox.fillStyle(0x222222, 0.8)
    this.loadingBox.fillRoundedRect(centerX - 200, centerY - 20, 400, 40, 10)
    this.loadingBox.lineStyle(3, 0xffffff, 0.8)
    this.loadingBox.strokeRoundedRect(centerX - 200, centerY - 20, 400, 40, 10)

    // Loading bar fill
    this.loadingBar = this.add.graphics()

    // Percentage text
    this.percentText = this.add.text(centerX, centerY - 60, '0%', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffff00',
      align: 'center'
    }).setOrigin(0.5, 0.5)

    // Asset name text
    this.assetText = this.add.text(centerX, centerY + 40, 'Initializing...', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 350 }
    }).setOrigin(0.5, 0.5)

    console.log("✅ Loading UI created")
  }

  private setupLoadingEvents(): void {
    // Update progress bar
    this.load.on('progress', (progress: number) => {
      this.currentProgress = progress
      if (this.loadingBar) {
        const barWidth = Math.floor(400 * progress)
        this.loadingBar.clear()
        this.loadingBar.fillStyle(0xff6b35, 0.9)
        this.loadingBar.fillRoundedRect(
          (screenSize.width.value / 2) - 200,
          (screenSize.height.value / 2) - 20,
          barWidth,
          40,
          10
        )
      }
      if (this.percentText) {
        this.percentText.setText(`${Math.floor(progress * 100)}%`)
      }
    })

    // Update current file being loaded
    this.load.on('fileprogress', (file: any) => {
      if (this.assetText) {
        this.assetText.setText(`Loading: ${file.key}`)
      }
      console.log(`  📥 ${file.key}`)
    })

    // Handle loading complete
    this.load.on('complete', () => {
      console.log("✅ All assets loaded successfully!")
      this.loadingComplete = true
      this.transitionToStartScene()
    })

    // Handle loading errors
    this.load.on('loaderror', (file: any) => {
      console.error(`❌ Failed to load: ${file.key} from ${file.src}`)
    })

    this.load.on('filecomplete', (key: string) => {
      console.log(`  ✓ ${key}`)
    })
  }

  private transitionToStartScene(): void {
    if (this.loadingComplete || this.currentProgress === 1) {
      console.log("🎮 Starting game...")
      this.scene.start('StartScene')
    }
  }

  private createGradientBackground(): void {
    const graphics = this.add.graphics()
    const width = screenSize.width.value
    const height = screenSize.height.value
    const pixelHeight = 2

    for (let i = 0; i < height; i += pixelHeight) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 0, g: 0, b: 0 } as any,
        { r: 20, g: 20, b: 40 } as any,
        height,
        i
      )
      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      graphics.fillRect(0, i, width, pixelHeight)
    }

    graphics.generateTexture('gradientBg', width, height)
    graphics.destroy()
    this.add.image(width / 2, height / 2, 'gradientBg')
  }

  private createFloatingFootballs(): void {
    const ballSize = 40
    const canvasWidth = screenSize.width.value
    const canvasHeight = screenSize.height.value

    for (let i = 0; i < 5; i++) {
      const x = Math.random() * (canvasWidth - ballSize) + ballSize / 2
      const y = Math.random() * (canvasHeight * 0.4)

      const graphics = this.add.graphics()
      graphics.fillStyle(0xffffff, 0.1)
      graphics.fillCircle(ballSize / 2, ballSize / 2, ballSize / 2)
      graphics.lineStyle(2, 0xff6b35, 0.3)
      graphics.strokeCircle(ballSize / 2, ballSize / 2, ballSize / 2)

      graphics.generateTexture(`ball${i}`, ballSize, ballSize)
      graphics.destroy()

      const ball = this.add.image(x, y, `ball${i}`)
      this.tweens.add({
        targets: ball,
        y: y + 100,
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.inOut'
      })
    }
  }
}
