import Phaser from "phaser"
import { fieldConfig } from "./gameConfig.json"

export type GoalSide = "left" | "right"

export class Goal extends Phaser.GameObjects.Container {
  private goalSide: GoalSide
  private goalPost!: Phaser.GameObjects.Image
  private goalZone!: Phaser.GameObjects.Zone
  private crossbar!: Phaser.Physics.Arcade.StaticBody
  private leftPost!: Phaser.Physics.Arcade.StaticBody
  private rightPost!: Phaser.Physics.Arcade.StaticBody


  constructor(scene: Phaser.Scene, x: number, y: number, goalSide: GoalSide) {
    super(scene, x, y)
    
    this.goalSide = goalSide
    
    console.log(`🥅 CREATING ${goalSide.toUpperCase()} GOAL at position (${x}, ${y})`)
    
    // Add to scene
    scene.add.existing(this)
    
    // **GOAL DEPTH** - set to appear behind players and ball but visible
    this.setDepth(0)  // Default depth, behind players (depth 1) and ball (depth 2)
    
    this.setupGoalPost()
    // this.setupGoalNet() // Removed: goal assets already have net, no need for overlay
    this.setupGoalZone()
    this.setupCollisionBodies()
    
    // **FINAL POSITION CHECK**
    console.log(`📍 ${goalSide.toUpperCase()} GOAL FINAL POSITIONS:`)
    console.log(`   Container world position: (${this.x}, ${this.y})`)
    console.log(`   Goal post local position: (${this.goalPost.x}, ${this.goalPost.y})`)
    console.log(`   Goal post world position: (${this.goalPost.x + this.x}, ${this.goalPost.y + this.y})`)
    console.log(`   Screen bounds check: X=${this.x} (should be 76 or 1076), Y=${this.y} (should be 648)`)
    
    // Additional visibility checks
    console.log(`🔍 ${goalSide.toUpperCase()} GOAL VISIBILITY CHECK:`)
    console.log(`   Container visible: ${this.visible}`)
    console.log(`   Container alpha: ${this.alpha}`)
    console.log(`   Goal post visible: ${this.goalPost.visible}`)
    console.log(`   Goal post alpha: ${this.goalPost.alpha}`)
    console.log(`   Goal post texture loaded: ${this.goalPost.texture.key}`)
    
    console.log(`✅ ${goalSide.toUpperCase()} GOAL created successfully`)
  }



  private setupGoalPost(): void {
    // **USE LEFT GOAL SPRITE FOR BOTH SIDES** - flip right goal horizontally
    const goalImageKey = "goal_left" // Always use left goal sprite
    
    this.goalPost = this.scene.add.image(0, 0, goalImageKey)
    
    // Set origin to bottom center to match ground positioning
    this.goalPost.setOrigin(0.5, 1)
    
    // Scale goals to appropriate size for the field
    const targetHeight = fieldConfig.goalHeight.value * 1.8 // Slightly larger for visual appeal
    const currentHeight = this.goalPost.height
    const scale = targetHeight / currentHeight
    this.goalPost.setScale(scale)
    
    // Flip right goal horizontally to mirror left goal
    if (this.goalSide === "right") {
      this.goalPost.setFlipX(true)
    }
    
    // Ensure the goal post image is visible by setting its own depth
    this.goalPost.setDepth(0)
    
    console.log(`🥅 ${this.goalSide.toUpperCase()} GOAL POST (IMAGE):`)
    console.log(`   Image key: ${goalImageKey}`)
    console.log(`   Original size: ${this.goalPost.width}x${this.goalPost.height}`)
    console.log(`   Target height: ${targetHeight}`)
    console.log(`   Scale applied: ${scale.toFixed(3)}`)
    console.log(`   Final size: ${(this.goalPost.width * scale).toFixed(1)}x${(this.goalPost.height * scale).toFixed(1)}`)
    console.log(`   Container position: (${this.x}, ${this.y})`)
    console.log(`   Goal post depth: ${this.goalPost.depth}`)
    
    this.add(this.goalPost)
  }


  private setupGoalZone(): void {
    // Create a trigger zone matching the actual opening between the posts.
    const goalWidth = Math.max(70, fieldConfig.goalWidth.value - 40) // Narrow the opening by 20px per side
    const goalHeight = Math.max(90, fieldConfig.goalHeight.value * 1.2)
    const zoneOffsetX = 0
    const zoneOffsetY = -goalHeight / 2 + 10
    
    this.goalZone = this.scene.add.zone(zoneOffsetX, zoneOffsetY, goalWidth, goalHeight)
    this.scene.physics.add.existing(this.goalZone, true)
    
    // Set as trigger (no collision, only overlap detection)
    const body = this.goalZone.body as Phaser.Physics.Arcade.StaticBody
    body.setSize(goalWidth, goalHeight)
    
    console.log(`🥅 ${this.goalSide.toUpperCase()} GOAL ZONE: Width=${goalWidth}, Height=${goalHeight}, OffsetX=${zoneOffsetX}, OffsetY=${zoneOffsetY}`)
    
    this.add(this.goalZone)
  }

  private setupCollisionBodies(): void {
    const goalWidth = Math.max(80, fieldConfig.goalWidth.value * 1.2)
    const goalHeight = Math.max(100, fieldConfig.goalHeight.value * 1.5)
    const postThickness = 8 // Reasonable post thickness
    const inwardOffsetX = 20
    const downwardOffsetY = 10
    const openingWidth = Math.max(40, goalWidth - inwardOffsetX * 2)
    
    // Create invisible collision bodies for goal posts
    // (The visual goal posts are already handled by the goal image)
    
    // Create crossbar (top horizontal bar collision)
    const crossbar = this.scene.add.rectangle(0, -goalHeight + postThickness / 2 + downwardOffsetY, goalWidth, postThickness, 0xffffff, 0)
    this.scene.physics.add.existing(crossbar, true)
    const crossbarBody = crossbar.body as Phaser.Physics.Arcade.StaticBody
    this.crossbar = crossbarBody
    this.add(crossbar)
    
    const leftPostX = -openingWidth / 2
    const rightPostX = openingWidth / 2
    const postY = -goalHeight / 2 + downwardOffsetY
    
    const leftPost = this.scene.add.rectangle(leftPostX, postY, postThickness, goalHeight, 0xffffff, 0)
    this.scene.physics.add.existing(leftPost, true)
    const leftPostBody = leftPost.body as Phaser.Physics.Arcade.StaticBody
    this.leftPost = leftPostBody
    this.add(leftPost)
    
    const rightPost = this.scene.add.rectangle(rightPostX, postY, postThickness, goalHeight, 0xffffff, 0)
    this.scene.physics.add.existing(rightPost, true)
    const rightPostBody = rightPost.body as Phaser.Physics.Arcade.StaticBody
    this.rightPost = rightPostBody
    this.add(rightPost)
  }

  public getGoalZone(): Phaser.GameObjects.Zone {
    return this.goalZone
  }

  public getCrossbar(): Phaser.Physics.Arcade.StaticBody {
    return this.crossbar
  }

  public getLeftPost(): Phaser.Physics.Arcade.StaticBody {
    return this.leftPost
  }

  public getRightPost(): Phaser.Physics.Arcade.StaticBody {
    return this.rightPost
  }

  public getGoalSide(): GoalSide {
    return this.goalSide
  }

  // Get all collision bodies for easy setup
  public getCollisionBodies(): Phaser.Physics.Arcade.StaticBody[] {
    return [this.crossbar, this.leftPost, this.rightPost]
  }

  public celebrateGoal(): void {
    // Simple goal post shake effect
    this.scene.tweens.add({
      targets: this.goalPost,
      x: this.goalPost.x + 3,
      duration: 60,
      yoyo: true,
      repeat: 3,
      ease: 'Power2'
    })
  }
}
