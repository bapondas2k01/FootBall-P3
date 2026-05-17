import Phaser from "phaser"
import { playerConfig, ballConfig, audioConfig } from "./gameConfig.json"

export type PlayerSide = "left" | "right"
export type PlayerState = "idle" | "walking" | "jumping" | "sliding" | "kicking" | "stunned"

export class Player extends Phaser.Physics.Arcade.Sprite {
  private playerSide: PlayerSide
  private playerState: PlayerState = "idle"
  private isStunned = false
  private stunTimer = 0
  private slideTimer = 0
  private kickTimer = 0 // Timer to force end kick state
  private facingRight = true
  private isOnGround = false
  private kickCooldown = 0
  private lastAnimationChange = 0 // Prevent animation flickering
  private lastDebugTime = 0 // For debug logging
  private standardHeight = 100 // Standard player height
  
  // Kick charging system
  private kickChargeAmount = 0 // 0-1, tracks charge level
  private kickChargeStartTime = 0 // Track when kick key was first pressed
  private maxChargeTime = 600 // Max charge time in ms (0-100% power)
  private isKickKeyPressed = false // Track current kick key state
  
  // Jump timer management
  private jumpFallTimer: Phaser.Time.TimerEvent | null = null
  private jumpLandTimer: Phaser.Time.TimerEvent | null = null
  
  // Physics body size enforcement
  private targetBodyWidth: number = 80
  private targetBodyHeight: number = 120
  
  // Animation frame data
  private animationData: { [key: string]: any } = {}
  
  // Sounds
  private kickSound!: Phaser.Sound.BaseSound
  private slideSound!: Phaser.Sound.BaseSound

  constructor(scene: Phaser.Scene, x: number, y: number, playerSide: PlayerSide) {
    console.log(`Creating player: side=${playerSide} at (${x}, ${y})`)
    
    const textureKey = playerSide === "left" ? "player1_idle_frame1" : "player2_idle_frame1"
    super(scene, x, y, textureKey)
    
    this.playerSide = playerSide
    // Player1 (left side) faces right, Player2 (right side) faces left toward center
    this.facingRight = playerSide === "left"
    
    console.log(`Player ${playerSide} facing right: ${this.facingRight}`)
    
    // Add to scene
    scene.add.existing(this)
    scene.physics.add.existing(this)
    
    // Set depth to appear above goals (-3) but below UI elements
    this.setDepth(1)
    
    this.setupPhysics()
    this.setupAnimations()
    this.setupAnimationListeners() // Add frame update listeners
    this.setupSounds()
    this.setupPlayerSize()
    
    // Start with idle animation
    this.play(this.getAnimationKey("idle"))
    this.resetOriginAndOffset()
    
    // Apply correct initial facing direction
    this.setFlipX(!this.facingRight)
    
    // Log final position after setup
    console.log(`✅ Player ${playerSide} created at final position: (${this.x}, ${this.y}), facing right: ${this.facingRight}`)
  }

  private setupPhysics(): void {
    if (!this.body) return
    
    const body = this.body as Phaser.Physics.Arcade.Body
    // Enable proper gravity for realistic physics
    body.setGravityY(playerConfig.gravityY.value)
    body.setCollideWorldBounds(true)
    body.setBounce(0, 0) // No bounce
    
    // Add damping for acceleration/deceleration effect
    body.setDrag(0.9, 0) // Horizontal drag coefficient for smooth acceleration
    body.setAccelerationX(0) // Will be set by movement input
    body.setMaxVelocity(800, 1200) // Reasonable max velocities
    
    console.log(`🔧 ${this.playerSide} Physics setup: gravity=${playerConfig.gravityY.value}`)
  }

  private setupPlayerSize(): void {
    console.log(`📏 ${this.playerSide} BEFORE setupPlayerSize: position=(${this.x}, ${this.y})`)
    
    // Scale sprite to reasonable size (128px height = 2 tiles)
    const idleFrameHeight = 560 // From animation data
    const standardHeight = 128 // 2 tiles
    const scale = standardHeight / idleFrameHeight
    
    this.setScale(scale)
    this.setOrigin(0.5, 1.0)
    
    console.log(`📏 ${this.playerSide} AFTER scale/origin: position=(${this.x}, ${this.y})`)
    
    // Store the target physics size as instance variables
    this.targetBodyWidth = 80
    this.targetBodyHeight = 120
    
    // Force physics body to exact size we want (will be enforced in update)
    if (this.body) {
      this.body.setSize(this.targetBodyWidth, this.targetBodyHeight)
      this.body.setOffset(0, 0)
      console.log(`${this.playerSide} player body set to: ${this.body.width}x${this.body.height}`)
      console.log(`📏 ${this.playerSide} AFTER body setup: position=(${this.x}, ${this.y})`)
    }
  }

  private setupAnimations(): void {
    const anims = this.scene.anims
    
    // Animation data with frame information
    this.animationData = {
      "player1_idle": {
        frames: [
          { key: "player1_idle_frame1", duration: 800, origin: { x: 0.5, y: 1.0 } },
          { key: "player1_idle_frame2", duration: 800, origin: { x: 0.5, y: 1.0 } }
        ]
      },
      "player1_walk": {
        frames: [
          { key: "player1_walk_frame1", duration: 300, origin: { x: 0.445, y: 1.0 } },
          { key: "player1_walk_frame2", duration: 300, origin: { x: 0.445, y: 1.0 } }
        ]
      },
      "player1_jump_up": {
        frames: [
          { key: "player1_jump_frame1", duration: 300, origin: { x: 0.436, y: 1.0 } }
        ]
      },
      "player1_jump_down": {
        frames: [
          { key: "player1_jump_frame2", duration: 400, origin: { x: 0.436, y: 1.0 } }
        ]
      },
      "player1_slide": {
        frames: [
          { key: "player1_slide_frame1", duration: 200, origin: { x: 0.458, y: 1.0 } },
          { key: "player1_slide_frame2", duration: 600, origin: { x: 0.458, y: 1.0 } }
        ]
      },
      "player1_kick": {
        frames: [
          { key: "player1_kick_frame1", duration: 150, origin: { x: 0.262, y: 1.0 } },
          { key: "player1_kick_frame2", duration: 200, origin: { x: 0.262, y: 1.0 } }
        ]
      },
      "player2_idle": {
        frames: [
          { key: "player2_idle_frame1", duration: 800, origin: { x: 0.5, y: 1.0 } },
          { key: "player2_idle_frame2", duration: 800, origin: { x: 0.5, y: 1.0 } }
        ]
      },
      "player2_walk": {
        frames: [
          { key: "player2_walk_frame1", duration: 300, origin: { x: 0.436, y: 1.0 } },
          { key: "player2_walk_frame2", duration: 300, origin: { x: 0.436, y: 1.0 } }
        ]
      },
      "player2_jump_up": {
        frames: [
          { key: "player2_jump_frame1", duration: 300, origin: { x: 0.421, y: 1.0 } }
        ]
      },
      "player2_jump_down": {
        frames: [
          { key: "player2_jump_frame2", duration: 400, origin: { x: 0.421, y: 1.0 } }
        ]
      },
      "player2_slide": {
        frames: [
          { key: "player2_slide_frame1", duration: 200, origin: { x: 0.415, y: 1.0 } },
          { key: "player2_slide_frame2", duration: 600, origin: { x: 0.415, y: 1.0 } }
        ]
      },
      "player2_kick": {
        frames: [
          { key: "player2_kick_frame1", duration: 150, origin: { x: 0.298, y: 1.0 } },
          { key: "player2_kick_frame2", duration: 200, origin: { x: 0.298, y: 1.0 } }
        ]
      }
    }

    // Create all animations
    Object.keys(this.animationData).forEach(key => {
      if (!anims.exists(key)) {
        anims.create({
          key: key,
          frames: this.animationData[key].frames.map((frame: any) => ({
            key: frame.key,
            duration: frame.duration
          })),
          repeat: key.includes("idle") || key.includes("walk") ? -1 : 0
        })
      }
    })
  }

  private setupAnimationListeners(): void {
    // Listen for animation frame changes to update origin dynamically
    this.on("animationupdate", () => {
      this.resetOriginAndOffset()
    })
    
    // Reset origin when animation starts
    this.on("animationstart", () => {
      this.scene.time.delayedCall(0, () => {
        this.resetOriginAndOffset()
      })
    })
  }

  private setupSounds(): void {
    this.kickSound = this.scene.sound.add("ball_kick", { 
      volume: audioConfig.sfxVolume.value 
    })
    this.slideSound = this.scene.sound.add("slide_tackle", { 
      volume: audioConfig.sfxVolume.value 
    })
  }

  private getAnimationKey(action: string): string {
    const playerNum = this.playerSide === "left" ? "player1" : "player2"
    return `${playerNum}_${action}`
  }

  private resetOriginAndOffset(): void {
    // **MINIMAL ORIGIN HANDLING** - only set if animation exists
    const currentAnim = this.anims.currentAnim
    if (!currentAnim || !this.body) return

    const animData = this.animationData[currentAnim.key]
    if (!animData || !animData.frames.length) return

    const currentFrame = this.anims.currentFrame
    const frameIndex = currentFrame ? currentFrame.index : 0
    const frameData = animData.frames[frameIndex]
    
    if (frameData && frameData.origin) {
      let originX = this.facingRight ? frameData.origin.x : (1 - frameData.origin.x)
      let originY = frameData.origin.y
      
      // **DIRECTLY SET ORIGIN** - no position restoration to avoid jitter
      this.setOrigin(originX, originY)
    }
  }

  public update(deltaTime: number, leftKey: boolean, rightKey: boolean, upKey: boolean, downKey: boolean, kickKey: boolean): void {
    // **UPDATE KICK CHARGING STATUS**
    this.updateKickCharging(kickKey)
    
    // **REDUCE PHYSICS INTERFERENCE** - only fix size when actually different
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body
      const sizeDiff = Math.abs(body.width - this.targetBodyWidth) + Math.abs(body.height - this.targetBodyHeight)
      
      // Only adjust if significant difference (more than 1 pixel)
      if (sizeDiff > 1) {
        console.log(`🔧 ${this.playerSide} Physics body size correction: ${body.width}x${body.height} → ${this.targetBodyWidth}x${this.targetBodyHeight}`)
        body.setSize(this.targetBodyWidth, this.targetBodyHeight)
        body.setOffset(0, 0)
      }
      
      // Debug: Check if player is out of bounds
      if (this.x < 0 || this.x > 1152 || this.y < 0 || this.y > 768) {
        console.log(`🚨 ${this.playerSide} OUT OF BOUNDS! Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`)
      }
    }
    
    this.updateTimers(deltaTime)
    this.updateGroundStatus()
    
    if (this.isStunned) {
      this.handleStunnedState()
      this.updateAnimation()
      return
    }
    
    if (this.playerState === "sliding") {
      this.handleSlidingState()
      this.updateAnimation()
      return
    }
    
    if (this.playerState === "kicking") {
      this.handleKickingState()
      this.updateAnimation()
      return
    }
    
    if (this.playerState === "jumping") {
      this.handleJumpingState(leftKey, rightKey)
      this.updateAnimation()
      return
    }
    
    this.handleInput(leftKey, rightKey, upKey, downKey, kickKey)
    this.updateAnimation()
    // REMOVE resetOriginAndOffset from update loop - only call when animation changes
    // this.resetOriginAndOffset()
  }

  private updateTimers(deltaTime: number): void {
    if (this.stunTimer > 0) {
      this.stunTimer -= deltaTime
      if (this.stunTimer <= 0) {
        this.isStunned = false
        this.clearTint()
        
        // **CRITICAL FIX** - reset playerState to idle when stun ends
        if (this.playerState === "stunned") {
          this.playerState = "idle"
          console.log(`🔄 ${this.playerSide} STUN RECOVERY: stunned → idle`)
          
          // Immediately switch to idle animation
          this.play(this.getAnimationKey("idle"), true)
          this.resetOriginAndOffset()
          this.lastAnimationChange = this.scene.time.now
        }
      }
    }
    
    if (this.slideTimer > 0) {
      this.slideTimer -= deltaTime
      if (this.slideTimer <= 0 && this.playerState === "sliding") {
        this.playerState = "idle"
      }
    }
    
    if (this.kickTimer > 0) {
      this.kickTimer -= deltaTime
      if (this.kickTimer <= 0 && this.playerState === "kicking") {
        console.log(`⏰ ${this.playerSide} kick timer expired`)
        
        // **SMART STATE RECOVERY** - check if player is in air
        if (!this.isOnGround) {
          // **RESUME JUMPING STATE** if in air
          this.playerState = "jumping"
          console.log(`🚀 ${this.playerSide} KICK→JUMP: resuming air state`)
          
          // If no jump timers exist, create new ones for landing
          if (!this.jumpFallTimer && !this.jumpLandTimer) {
            const body = this.body as Phaser.Physics.Arcade.Body
            console.log(`⚙️ ${this.playerSide} Creating new jump timers for air kick recovery`)
            
            // Create fall timer if going up
            if (body.velocity.y < 0) {
              this.jumpFallTimer = this.scene.time.delayedCall(300, () => {
                if (this.playerState === "jumping") {
                  body.setVelocityY(playerConfig.jumpPower.value * 0.8)
                  console.log(`⬇️ ${this.playerSide} AIR KICK FALL! velY=${(playerConfig.jumpPower.value * 0.8).toFixed(1)}`)
                }
              })
            }
            
            // Create land timer
            this.jumpLandTimer = this.scene.time.delayedCall(600, () => {
              if (this.playerState === "jumping") {
                this.setY(648)
                body.setVelocityY(0)
                this.playerState = "idle"
                console.log(`🛬 ${this.playerSide} AIR KICK LAND!`)
              }
            })
          }
        } else {
          // **GROUND KICK** - return to idle
          this.playerState = "idle"
          console.log(`🦵 ${this.playerSide} KICK→IDLE: ground kick complete`)
        }
        
        // Update animation regardless
        this.lastAnimationChange = this.scene.time.now
      }
    }
    
    if (this.kickCooldown > 0) {
      this.kickCooldown -= deltaTime
    }
  }

  private updateGroundStatus(): void {
    if (!this.body) return
    
    const body = this.body as Phaser.Physics.Arcade.Body
    const groundLevel = 648 // **FIXED**: Match GameScene's groundTopY = 648
    
    // Proper ground detection using physics body
    this.isOnGround = body.touching.down || (this.y >= groundLevel - 5 && body.velocity.y >= 0)
    
    // **LANDING DETECTION** - transition from jumping to idle
    if (this.playerState === "jumping" && this.isOnGround) {
      this.playerState = "idle"
      body.setVelocityY(0) // Stop downward movement
      this.play(this.getAnimationKey("idle"), true)
      this.resetOriginAndOffset()
      this.lastAnimationChange = this.scene.time.now
      console.log(`🛬 ${this.playerSide} LANDED!`)
      
      // Clear jump timers
      this.clearJumpTimers()
    }
    
    // **OPTIONAL POSITION CORRECTION** - gentle adjustment only
    if (this.y > groundLevel + 10) {
      console.log(`📍 ${this.playerSide} GENTLE POSITION ADJUST: Y=${this.y.toFixed(1)} → ${groundLevel}`)
      this.setY(groundLevel)
      body.setVelocityY(0)
    }
    
    // **BASIC BOUNDARY ENFORCEMENT** - prevent going off screen
    const leftBound = 10
    const rightBound = 1142  // screenWidth - 10
    
    if (this.x < leftBound) {
      this.setX(leftBound)
      body.setVelocityX(0)
    } else if (this.x > rightBound) {
      this.setX(rightBound)
      body.setVelocityX(0)
    }
    
    // **VELOCITY SANITY CHECK** - prevent excessive velocities
    if (Math.abs(body.velocity.x) > 800) {
      body.setVelocityX(Math.sign(body.velocity.x) * 800)
    }
    
    if (Math.abs(body.velocity.y) > 1200) {
      body.setVelocityY(Math.sign(body.velocity.y) * 1200)
    }
    
    // Debug logging for Player2
    if (this.playerSide === "right") {
      const currentTime = this.scene.time.now
      if (!this.lastDebugTime || currentTime - this.lastDebugTime > 1000) {
        console.log(`📊 Player2 PHYSICS: Y=${this.y.toFixed(1)}, vY=${body.velocity.y.toFixed(1)}, ground=${this.isOnGround}, state=${this.playerState}`)
        this.lastDebugTime = currentTime
      }
    }
  }

  private handleStunnedState(): void {
    if (this.body) {
      this.body.setVelocityX(0)
    }
    // Flash red tint when stunned
    this.setTint(0xff6666)
  }

  private handleSlidingState(): void {
    // Continue sliding movement with gradual deceleration
    if (this.body) {
      const slideAcceleration = 1200 // Slide deceleration
      const slideDirection = this.facingRight ? 1 : -1
      this.body.setAccelerationX(-slideDirection * slideAcceleration) // Friction-like deceleration
    }
  }

  private handleKickingState(): void {
    // Stop movement during kick
    if (this.body) {
      this.body.setVelocityX(0)
    }
    
    // Kick state is now handled by kickTimer in updateTimers
    // No need for animation detection here as it's unreliable
  }

  private handleJumpingState(leftKey: boolean, rightKey: boolean): void {
    // During jump, apply acceleration just like on ground
    const body = this.body as Phaser.Physics.Arcade.Body
    const moveAcceleration = 1500
    let accelerationX = 0
    
    if (leftKey && !rightKey) {
      accelerationX = -moveAcceleration
      this.facingRight = false
    } else if (rightKey && !leftKey) {
      accelerationX = moveAcceleration
      this.facingRight = true
    } else {
      // Deceleration when no keys pressed
      accelerationX = body.velocity.x > 0 ? -moveAcceleration * 0.8 : moveAcceleration * 0.8
    }
    
    // Apply acceleration during jump
    body.setAccelerationX(accelerationX)
    
    // Reduced debug output
    if (accelerationX !== 0) {
      console.log(`🚀 ${this.playerSide} JUMPING ACCEL: aX=${accelerationX}, vY=${body.velocity.y.toFixed(1)}`)
    }
  }

  private handleInput(leftKey: boolean, rightKey: boolean, upKey: boolean, downKey: boolean, kickKey: boolean): void {
    if (!this.body || this.isStunned) {
      return
    }
    
    const body = this.body as Phaser.Physics.Arcade.Body
    
    // Skip input during special states (but allow movement during kick)
    if (this.playerState === "sliding") {
      return // Sliding movement is handled in handleSlidingState
    }
    
    // Horizontal movement with acceleration for realistic physics
    const moveAcceleration = 1500 // Acceleration per frame
    let accelerationX = 0
    
    if (leftKey && !rightKey) {
      accelerationX = -moveAcceleration
      this.facingRight = false
    } else if (rightKey && !leftKey) {
      accelerationX = moveAcceleration
      this.facingRight = true
    } else {
      // Deceleration when no keys pressed
      accelerationX = body.velocity.x > 0 ? -moveAcceleration * 0.8 : moveAcceleration * 0.8
    }
    
    // Apply acceleration (physics-based)
    body.setAccelerationX(accelerationX)
    
    // **ACTION PRIORITY SYSTEM** - prevent conflicting actions
    let actionTaken = false
    
    // **JUMPING** - highest priority when grounded
    if (upKey && this.isOnGround && this.playerState === "idle" && !actionTaken) {
      this.playerState = "jumping"
      body.setVelocityY(-playerConfig.jumpPower.value)
      console.log(`🚀 ${this.playerSide} JUMP! velY=${-playerConfig.jumpPower.value}`)
      actionTaken = true
      
      // **IMMEDIATELY START JUMP ANIMATION**
      this.play(this.getAnimationKey("jump_up"), true)
      this.resetOriginAndOffset()
      this.lastAnimationChange = this.scene.time.now
      
      // Clear any existing jump timers
      this.clearJumpTimers()
      
      // Transition to fall animation when velocity changes
      this.jumpFallTimer = this.scene.time.delayedCall(150, () => {
        if (this.playerState === "jumping" && body.velocity.y > 0) {
          this.play(this.getAnimationKey("jump_down"), true)
          this.resetOriginAndOffset()
          this.lastAnimationChange = this.scene.time.now
        }
      })
    }
    
    // **SLIDING** - second priority, only when grounded and idle
    if (downKey && this.isOnGround && this.slideTimer <= 0 && this.playerState === "idle" && !actionTaken) {
      this.startSlide()
      actionTaken = true
    }
    
    // **KICKING** - lowest priority, but can interrupt jumping for air kicks
    if (kickKey && this.kickCooldown <= 0 && this.playerState !== "sliding" && !actionTaken) {
      this.startKick()
      actionTaken = true
    }
    
    // Debug for Player2
    if (this.playerSide === "right" && (leftKey || rightKey || upKey || downKey || kickKey)) {
      console.log(`🎮 Player2 INPUT: L=${leftKey} R=${rightKey} U=${upKey} D=${downKey} K=${kickKey} → state=${this.playerState}`)
    }
  }

  private startSlide(): void {
    this.playerState = "sliding"
    this.slideTimer = playerConfig.slideDuration.value * 1000 // Convert to ms
    this.slideSound.play()
    this.play(this.getAnimationKey("slide"), true)
    
    // **SLIDE VISUAL EFFECTS**
    // Add slight screen shake for impact
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.shake(100, 0.005)
    }
    
    // Add dust particle effect (simple tint flash)
    this.setTint(0xDDDDDD) // Light grey tint
    this.scene.time.delayedCall(200, () => {
      this.clearTint()
    })
    
    console.log(`🏃 ${this.playerSide} START SLIDE - timer set to ${this.slideTimer}ms`)
  }

  private startKick(): void {
    this.playerState = "kicking"
    this.kickTimer = playerConfig.kickDuration.value * 1000 // Use config value
    this.kickCooldown = 500 // 0.5 second cooldown
    this.kickSound.play()
    this.play(this.getAnimationKey("kick"), true)
    
    // **CRITICAL** - Immediately set origin for kick frame
    this.scene.time.delayedCall(0, () => {
      this.resetOriginAndOffset()
      this.setFlipX(!this.facingRight)
    })
    
    console.log(`🦵 ${this.playerSide} START KICK - timer set to ${this.kickTimer}ms`)
  }

  private updateAnimation(): void {
    // **FIRST PRIORITY** - Force fix any state/animation mismatch
    const currentAnim = this.anims.currentAnim?.key || ""
    
    // If state is idle but animation is still kick/slide, immediately fix it
    if (this.playerState === "idle" && (currentAnim.includes("kick") || currentAnim.includes("slide"))) {
      console.log(`🔄 ${this.playerSide} IMMEDIATE ANIMATION FIX: state=idle but anim=${currentAnim} → forcing idle`)
      this.play(this.getAnimationKey("idle"), true)
      this.resetOriginAndOffset()
      this.lastAnimationChange = this.scene.time.now
      return
    }
    
    // Debouncing for other animation changes (reduced for better responsiveness)
    const now = this.scene.time.now
    if (now - this.lastAnimationChange < 100) return
    
    if (this.isStunned) return
    
    // **SPECIAL STATE ANIMATIONS** - only if state matches
    if (this.playerState === "kicking") {
      if (!currentAnim.includes("kick")) {
        this.play(this.getAnimationKey("kick"), true)
        this.resetOriginAndOffset()
        this.lastAnimationChange = now
        console.log(`🦵 ${this.playerSide} KICK ANIMATION STARTED`)
      }
      this.setFlipX(!this.facingRight)
      return
    }
    
    if (this.playerState === "sliding") {
      if (!currentAnim.includes("slide")) {
        this.play(this.getAnimationKey("slide"), true)
        this.resetOriginAndOffset()
        this.lastAnimationChange = now
        console.log(`🏃 ${this.playerSide} SLIDE ANIMATION STARTED`)
      }
      this.setFlipX(!this.facingRight)
      return
    }
    
    // **JUMPING STATE ANIMATION** - handle jump animations based on velocity
    if (this.playerState === "jumping") {
      const velY = this.body ? this.body.velocity.y : 0
      let targetAnim = ""
      
      // Determine jump animation based on vertical velocity
      if (velY < -30) {
        targetAnim = this.getAnimationKey("jump_up")
      } else {
        targetAnim = this.getAnimationKey("jump_down")
      }
      
      // Change animation if needed
      if (targetAnim !== currentAnim) {
        console.log(`🚀 ${this.playerSide} JUMP ANIMATION: ${currentAnim} → ${targetAnim} (velY: ${velY.toFixed(1)})`)
        this.play(targetAnim, true)
        this.resetOriginAndOffset()
        this.lastAnimationChange = now
      }
      this.setFlipX(!this.facingRight)
      return
    }
    
    // **NORMAL MOVEMENT ANIMATIONS** - only for idle state
    if (this.playerState === "idle") {
      const speedX = this.body ? Math.abs(this.body.velocity.x) : 0
      const velY = this.body ? this.body.velocity.y : 0
      
      let targetAnim = ""
      
      // Air animations
      if (!this.isOnGround) {
        targetAnim = velY < -30 ? this.getAnimationKey("jump_up") : this.getAnimationKey("jump_down")
      } else {
        // Ground animations with hysteresis
        const isCurrentlyWalking = currentAnim.includes("walk")
        const walkStartThreshold = 80
        const walkStopThreshold = 30
        
        if (isCurrentlyWalking) {
          targetAnim = speedX > walkStopThreshold ? this.getAnimationKey("walk") : this.getAnimationKey("idle")
        } else {
          targetAnim = speedX > walkStartThreshold ? this.getAnimationKey("walk") : this.getAnimationKey("idle")
        }
      }
      
      // Change animation if needed
      if (targetAnim !== currentAnim) {
        console.log(`🎬 ${this.playerSide}: ${currentAnim} → ${targetAnim} (speedX: ${speedX.toFixed(1)}, onGround: ${this.isOnGround})`)
        this.play(targetAnim, true)
        this.resetOriginAndOffset()
        this.lastAnimationChange = now
      }
    }
    
    // Update flip
    this.setFlipX(!this.facingRight)
  }

  public stun(): void {
    this.isStunned = true
    this.stunTimer = playerConfig.stunDuration.value * 1000 // Convert to ms
    this.playerState = "stunned"
    
    if (this.body) {
      this.body.setVelocityX(0)
    }
  }

  public isSliding(): boolean {
    return this.playerState === "sliding"
  }

  public isKicking(): boolean {
    return this.playerState === "kicking"
  }

  public getPlayerSide(): PlayerSide {
    return this.playerSide
  }

  public getFacingDirection(): "left" | "right" {
    return this.facingRight ? "right" : "left"
  }

  public getFacingRight(): boolean {
    return this.facingRight
  }

  public getKickForce(): Phaser.Math.Vector2 {
    // **DYNAMIC KICK FORCE** based on player state, movement, and charge amount
    let kickForce = ballConfig.normalKickForce.value // Default force
    let verticalForce = -100 // Default upward force
    
    const speedX = this.body ? Math.abs(this.body.velocity.x) : 0
    const isRunning = speedX > 150 // Player is running
    const isInAir = !this.isOnGround
    const isSliding = this.playerState === "sliding"
    
    // **DIFFERENT KICK TYPES**
    if (isSliding) {
      // **SLIDE KICK** - lower but faster kick
      kickForce = ballConfig.slideKickForce.value
      verticalForce = -50 // Lower trajectory
      console.log(`🏃⚽ ${this.playerSide} SLIDE KICK! Force: ${kickForce}, VerticalForce: ${verticalForce}`)
    } else if (isInAir) {
      // **JUMP KICK** - moderate force with higher trajectory  
      kickForce = ballConfig.jumpKickForce.value
      verticalForce = -150 // Higher trajectory
      console.log(`🚀⚽ ${this.playerSide} JUMP KICK! Force: ${kickForce}, VerticalForce: ${verticalForce}`)
    } else if (isRunning) {
      // **RUNNING KICK** - maximum force
      kickForce = ballConfig.runningKickForce.value
      verticalForce = -120 // Balanced trajectory
      console.log(`🏃⚽ ${this.playerSide} RUNNING KICK! Force: ${kickForce}, VerticalForce: ${verticalForce}`)
    } else {
      // **NORMAL KICK** - standard force
      kickForce = ballConfig.normalKickForce.value
      verticalForce = -100
      console.log(`⚽ ${this.playerSide} NORMAL KICK! Force: ${kickForce}, VerticalForce: ${verticalForce}`)
    }
    
    // **APPLY CHARGE MULTIPLIER** - charged kicks are more powerful
    const chargeMultiplier = 0.8 + (this.kickChargeAmount * 0.4) // 0.8x to 1.2x based on charge (0-100%)
    kickForce *= chargeMultiplier
    verticalForce *= chargeMultiplier
    
    // **MOMENTUM TRANSFER** - add player velocity to kick
    const playerVelX = this.body ? this.body.velocity.x : 0
    const momentumTransfer = playerVelX * 0.3 // 30% of player velocity transfers to ball
    
    const kickDirection = this.facingRight ? 1 : -1
    return new Phaser.Math.Vector2(kickDirection * kickForce + momentumTransfer, verticalForce)
  }
  
  private updateKickCharging(kickKeyPressed: boolean): void {
    // Track kick key state transitions
    if (!this.isKickKeyPressed && kickKeyPressed) {
      // Key just pressed - start charging
      this.kickChargeStartTime = this.scene.time.now
      this.kickChargeAmount = 0
      console.log(`⚡ ${this.playerSide} KICK CHARGE STARTED`)
    }
    
    if (this.isKickKeyPressed && !kickKeyPressed) {
      // Key just released - charge complete
      if (this.kickChargeAmount > 0) {
        console.log(`💥 ${this.playerSide} KICK RELEASED! Charge: ${(this.kickChargeAmount * 100).toFixed(0)}%`)
      }
      this.kickChargeAmount = 0
    }
    
    // Update charge level if key is held
    if (kickKeyPressed && this.kickCooldown <= 0 && this.playerState !== "sliding") {
      const chargeTime = this.scene.time.now - this.kickChargeStartTime
      this.kickChargeAmount = Math.min(chargeTime / this.maxChargeTime, 1.0) // Clamp to 0-1
    } else {
      this.kickChargeAmount = 0
    }
    
    this.isKickKeyPressed = kickKeyPressed
  }
  
  public getKickChargeAmount(): number {
    return this.kickChargeAmount
  }

  public triggerKick(): void {
    if (this.kickCooldown <= 0) {
      this.startKick()
    }
  }

  public getKickInfo(): { force: Phaser.Math.Vector2, type: "normal" | "slide" | "jump", distance: number, chargeAmount: number, playerVelocity: Phaser.Math.Vector2 } {
    const speedX = this.body ? Math.abs(this.body.velocity.x) : 0
    const isRunning = speedX > 150
    const isSliding = this.playerState === "sliding"
    const isInAir = !this.isOnGround
    
    let kickType: "normal" | "slide" | "jump" = "normal"
    let distance = 100 // Base distance
    
    if (isSliding) {
      kickType = "slide"
      distance = 200 // Slide tackles are very powerful
    } else if (isInAir) {
      kickType = "jump" 
      distance = 120 // Jump kicks have moderate power
    } else if (isRunning) {
      distance = 180 // Running kicks are strong
    }
    
    // Distance multiplier based on charge amount
    const chargeDistanceBonus = this.kickChargeAmount * 100 // Additional distance bonus from charge
    distance += chargeDistanceBonus
    
    const force = this.getKickForce()
    const playerVelocity = this.body ? (this.body as Phaser.Physics.Arcade.Body).velocity.clone() : new Phaser.Math.Vector2(0, 0)
    
    return { force, type: kickType, distance, chargeAmount: this.kickChargeAmount, playerVelocity }
  }

  private clearJumpTimers(): void {
    if (this.jumpFallTimer) {
      this.jumpFallTimer.destroy()
      this.jumpFallTimer = null
    }
    if (this.jumpLandTimer) {
      this.jumpLandTimer.destroy()
      this.jumpLandTimer = null
    }
  }

  // Reset player to initial state for kickoff
  public resetToKickoff(): void {
    console.log(`🔄 ${this.playerSide.toUpperCase()} RESET TO KICKOFF`)
    
    // Stop all movement and physics
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
      body.setAngularVelocity(0)
    }
    
    // Reset all timers and states
    this.isStunned = false
    this.stunTimer = 0
    this.slideTimer = 0
    this.kickTimer = 0
    this.kickCooldown = 0
    this.playerState = "idle"
    
    // Clear any active timers
    this.clearJumpTimers()
    
    // Stop all tweens on this player
    this.scene.tweens.killTweensOf(this)
    
    // Reset facing direction to initial
    this.facingRight = this.playerSide === "left"
    this.setFlipX(!this.facingRight)
    
    // Force idle animation and reset origin
    this.play(this.getAnimationKey("idle"), true)
    this.resetOriginAndOffset()
    
    // Clear any visual effects (tints, alpha changes, etc.)
    this.clearTint()
    this.setAlpha(1)
    this.setScale(this.scaleX, this.scaleY) // Reset to current scale
    
    console.log(`✅ ${this.playerSide.toUpperCase()} KICKOFF RESET COMPLETE`)
  }
}