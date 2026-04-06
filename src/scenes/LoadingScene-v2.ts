import Phaser from "phaser"
import { screenSize } from "../gameConfig.json"

export default class LoadingScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics
  private percentText!: Phaser.GameObjects.Text
  private assetText!: Phaser.GameObjects.Text
  private loadingComplete = false

  constructor() {
    super({ key: "LoadingScene" })
  }

  init() {
    console.log("🎮 LoadingScene initialized")
  }

  preload() {
    console.log("🔄 Preload started - Loading all assets")
    
    // Create loading UI
    this.createLoadingUI()
    
    // Set up progress events
    this.setupLoadingEvents()
    
    // Load all assets directly (not using pack loader)
    this.loadAllAssets()
  }

  create() {
    console.log("✅ LoadingScene create - transitioning to StartScene")
    this.scene.start('StartScene')
  }

  private loadAllAssets(): void {
    console.log("\n📦 Queuing assets for loading...\n")

    // UI Images
    console.log("🎨 UI Images:")
    this.load.image('game_title', 'assets/images/game_title.png')
    this.load.image('play_button', 'assets/images/play_button.png')
    this.load.image('restart_button', 'assets/images/restart_button.png')
    this.load.image('back_button', 'assets/images/back_button.png')
    this.load.image('victory_banner', 'assets/images/victory_banner.png')
    this.load.image('goal_text', 'assets/images/goal_text.png')
    this.load.image('stun_stars', 'assets/images/stun_stars.png')
    this.load.image('ui_panel', 'assets/images/ui_panel.png')

    // Backgrounds
    console.log("🌍 Backgrounds:")
    this.load.image('soccer_field_background', 'assets/images/soccer_field_background.png')
    this.load.image('clean_soccer_field_background', 'assets/images/clean_soccer_field_background.png')

    // Game Objects
    console.log("⚽ Game Objects:")
    this.load.image('soccer_ball', 'assets/images/soccer_ball.png')
    this.load.image('goal_left', 'assets/images/goal_left.png')
    this.load.image('goal_right', 'assets/images/goal_right.png')
    
    // Goal variants
    this.load.image('goal_cartoon_left', 'assets/images/cartoon_goal_left.png')
    this.load.image('goal_cartoon_right', 'assets/images/cartoon_goal_right.png')
    this.load.image('goal_fixed_left', 'assets/images/fixed_goal_left.png')
    this.load.image('goal_fixed_right', 'assets/images/fixed_goal_right.png')
    this.load.image('goal_post_left', 'assets/images/left_goal_post.png')
    this.load.image('goal_post_right', 'assets/images/right_goal_post.png')

    // Player Animations (original)
    console.log("👥 Player Animations (Original):")
    this.load.image('player1_idle_frame1', 'assets/images/player1_idle_frame1.png')
    this.load.image('player1_idle_frame2', 'assets/images/player1_idle_frame2.png')
    this.load.image('player1_walk_frame1', 'assets/images/player1_walk_frame1.png')
    this.load.image('player1_walk_frame2', 'assets/images/player1_walk_frame2.png')
    this.load.image('player1_jump_frame1', 'assets/images/player1_jump_frame1.png')
    this.load.image('player1_jump_frame2', 'assets/images/player1_jump_frame2.png')
    this.load.image('player1_slide_frame1', 'assets/images/player1_slide_frame1.png')
    this.load.image('player1_slide_frame2', 'assets/images/player1_slide_frame2.png')
    this.load.image('player1_kick_frame1', 'assets/images/player1_kick_frame1.png')
    this.load.image('player1_kick_frame2', 'assets/images/player1_kick_frame2.png')

    this.load.image('player2_idle_frame1', 'assets/images/player2_idle_frame1.png')
    this.load.image('player2_idle_frame2', 'assets/images/player2_idle_frame2.png')
    this.load.image('player2_walk_frame1', 'assets/images/player2_walk_frame1.png')
    this.load.image('player2_walk_frame2', 'assets/images/player2_walk_frame2.png')
    this.load.image('player2_jump_frame1', 'assets/images/player2_jump_frame1.png')
    this.load.image('player2_jump_frame2', 'assets/images/player2_jump_frame2.png')
    this.load.image('player2_slide_frame1', 'assets/images/player2_slide_frame1.png')
    this.load.image('player2_slide_frame2', 'assets/images/player2_slide_frame2.png')
    this.load.image('player2_kick_frame1', 'assets/images/player2_kick_frame1.png')
    this.load.image('player2_kick_frame2', 'assets/images/player2_kick_frame2.png')

    // Victory/Defeat Poses
    console.log("🏆 Victory/Defeat Poses:")
    this.load.image('player1_victory_pose', 'assets/images/player1_victory_pose.png')
    this.load.image('player1_defeat_pose', 'assets/images/player1_defeat_pose.png')
    this.load.image('player2_victory_pose', 'assets/images/player2_victory_pose.png')
    this.load.image('player2_defeat_pose', 'assets/images/player2_defeat_pose.png')
    this.load.image('players_draw_pose', 'assets/images/players_draw_pose.png')

    // Player Variants
    console.log("👤 Player Variants:")
    this.load.image('player_blue_back', 'assets/images/player_blue_back_view.png')
    this.load.image('player_blue_front', 'assets/images/player_blue_front_view.png')
    this.load.image('player_blue_side', 'assets/images/player_blue_side_view.png')
    this.load.image('player_red_back', 'assets/images/player_red_back_view.png')
    this.load.image('player_red_front', 'assets/images/player_red_front_view.png')
    this.load.image('player_red_side', 'assets/images/player_red_side_view.png')

    // Sound Effects
    console.log("🔊 Sound Effects:")
    this.load.audio('button_click', 'assets/audio/button_click_3.mp3')
    this.load.audio('game_start', 'assets/audio/game_start.mp3')
    this.load.audio('ball_kick', 'assets/audio/ball_kick.mp3')
    this.load.audio('ball_bounce', 'assets/audio/ball_bounce.mp3')
    this.load.audio('goal_cheer', 'assets/audio/goal_cheer.mp3')
    this.load.audio('whistle', 'assets/audio/whistle_2.mp3')
    this.load.audio('slide_tackle', 'assets/audio/slide_tackle_2.mp3')
    this.load.audio('goal_post_hit', 'assets/audio/goal_post_hit.mp3')
    this.load.audio('victory_fanfare', 'assets/audio/victory_fanfare.mp3')

    // Background Music
    console.log("🎵 Background Music:")
    this.load.audio('soccer_theme', 'assets/audio/soccer_theme.wav')
    this.load.audio('soccer_match_theme', 'assets/audio/soccer_match_theme_2.wav')

    console.log("\n✅ All assets queued for loading\n")
  }

  private createLoadingUI(): void {
    const centerX = screenSize.width.value / 2
    const centerY = screenSize.height.value / 2

    // Background
    const graphics = this.add.graphics()
    graphics.fillStyle(0x000000, 1)
    graphics.fillRect(0, 0, screenSize.width.value, screenSize.height.value)

    // Title
    this.add.text(centerX, centerY - 150, 'ARCADE SOCCER', {
      fontSize: '56px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#ff6b35',
      strokeThickness: 6
    }).setOrigin(0.5, 0.5)

    // Loading text
    this.add.text(centerX, centerY - 80, 'Loading...', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#cccccc'
    }).setOrigin(0.5, 0.5)

    // Loading bar background
    const loadingBoxGraphics = this.add.graphics()
    loadingBoxGraphics.fillStyle(0x222222, 0.8)
    loadingBoxGraphics.fillRoundedRect(centerX - 200, centerY - 20, 400, 40, 10)
    loadingBoxGraphics.lineStyle(3, 0xffffff, 0.8)
    loadingBoxGraphics.strokeRoundedRect(centerX - 200, centerY - 20, 400, 40, 10)

    // Loading bar fill
    this.loadingBar = this.add.graphics()

    // Progress text
    this.percentText = this.add.text(centerX, centerY - 60, '0%', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffff00'
    }).setOrigin(0.5, 0.5)

    // Asset name text
    this.assetText = this.add.text(centerX, centerY + 40, 'Initializing...', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
      wordWrap: { width: 350 }
    }).setOrigin(0.5, 0.5)
  }

  private setupLoadingEvents(): void {
    // Update progress bar
    this.load.on('progress', (progress: number) => {
      const centerX = screenSize.width.value / 2
      const centerY = screenSize.height.value / 2
      const barWidth = Math.floor(400 * progress)

      this.loadingBar.clear()
      this.loadingBar.fillStyle(0xff6b35, 0.9)
      this.loadingBar.fillRoundedRect(centerX - 200, centerY - 20, barWidth, 40, 10)

      this.percentText.setText(`${Math.floor(progress * 100)}%`)
    })

    // Update current file
    this.load.on('fileprogress', (file: any) => {
      this.assetText.setText(`Loading: ${file.key}`)
    })

    // Handle errors
    this.load.on('loaderror', (file: any) => {
      console.error(`❌ Failed to load: ${file.key}`)
      this.assetText.setText(`Error loading: ${file.key}`)
    })

    this.load.on('complete', () => {
      console.log("✅ All assets loaded successfully!")
      this.loadingComplete = true
    })
  }
}
