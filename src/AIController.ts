import Phaser from "phaser"
import { Player } from "./Player"
import { Ball } from "./Ball"

export class AIController {
  private player: Player
  private ball: Ball
  private opponent: Player
  private scene: Phaser.Scene
  
  // AI behavior timers and states
  private reactionTime = 200 // ms delay for AI reactions
  private lastDecisionTime = -9999
  private currentAction: "idle" | "chase" | "defend" | "attack" = "chase"
  private actionTimer = 0
  private jumpTimer = 0
  private kickTimer = 0
  
  // AI difficulty settings
  private moveAccuracy = 0.8 // 0-1, how precisely AI moves toward target
  private reactionSpeed = 1.0 // multiplier for reaction times
  private aggressiveness = 0.7 // 0-1, how aggressive AI is
  private kickAccuracy = 0.6 // 0-1, how accurately AI kicks

  constructor(scene: Phaser.Scene, player: Player, ball: Ball, opponent: Player, difficulty: "easy" | "medium" | "hard" = "medium") {
    this.scene = scene
    this.player = player
    this.ball = ball
    this.opponent = opponent
    
    this.setDifficulty(difficulty)
  }

  private setDifficulty(difficulty: "easy" | "medium" | "hard"): void {
    switch (difficulty) {
      case "easy":
        this.moveAccuracy = 0.6
        this.reactionSpeed = 0.7
        this.aggressiveness = 0.4
        this.kickAccuracy = 0.4
        this.reactionTime = 400
        break
      case "medium":
        this.moveAccuracy = 0.8
        this.reactionSpeed = 1.0
        this.aggressiveness = 0.7
        this.kickAccuracy = 0.6
        this.reactionTime = 200
        break
      case "hard":
        this.moveAccuracy = 0.95
        this.reactionSpeed = 1.3
        this.aggressiveness = 0.9
        this.kickAccuracy = 0.8
        this.reactionTime = 100
        break
    }
  }

  public update(deltaTime: number): void {
    // Update timers
    this.actionTimer -= deltaTime
    this.jumpTimer -= deltaTime
    this.kickTimer -= deltaTime
    
    // Make decisions periodically with more stable intervals
    if (this.scene.time.now - this.lastDecisionTime >= this.reactionTime / this.reactionSpeed) {
      this.makeDecision()
      this.lastDecisionTime = this.scene.time.now
    }
    
    // Execute current action
    const controls = this.executeAction()
    
    // **GENTLE AI** - limit rapid actions to prevent bouncing
    if (controls.jump && this.jumpTimer > 0) {
      controls.jump = false // Prevent rapid jumping
    }
    
    if (controls.slide && this.player.isSliding()) {
      controls.slide = false // Prevent slide spam
    }
    
    if (controls.kick && this.player.isKicking()) {
      controls.kick = false // Prevent kick spam
    }
    
    // Update player with AI controls
    this.player.update(deltaTime, controls.left, controls.right, controls.jump, controls.slide, controls.kick)
  }

  private makeDecision(): void {
    const ballPos = { x: this.ball.x, y: this.ball.y }
    const playerPos = { x: this.player.x, y: this.player.y }
    const opponentPos = { x: this.opponent.x, y: this.opponent.y }
    
    const distanceToBall = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, ballPos.x, ballPos.y)
    const ballVelocity = this.ball.getVelocity()
    
    // Determine AI's goal side for defensive positioning
    const isRightSide = this.player.getPlayerSide() === "right"
    const ownGoalX = isRightSide ? this.scene.cameras.main.width * 0.9 : this.scene.cameras.main.width * 0.1
    
    // Decision making based on game state
    if (distanceToBall < 80 && this.ball.isMoving() === false) {
      // Ball is close and stationary - go for it
      this.currentAction = "attack"
      this.actionTimer = 1000 + Math.random() * 500
    } else if (distanceToBall < 120 && ballVelocity.length() < 100) {
      // Ball is nearby and slow - chase it
      this.currentAction = "chase"
      this.actionTimer = 800 + Math.random() * 400
    } else if (ballPos.x < ownGoalX + 200 && ballPos.x > ownGoalX - 200) {
      // Ball is near own goal - defend
      this.currentAction = "defend"
      this.actionTimer = 600 + Math.random() * 300
    } else {
      // Default behavior - proactively move toward the ball even when not yet contested
      this.currentAction = "chase"
      this.actionTimer = 400 + Math.random() * 200
    }
  }

  private executeAction(): { left: boolean, right: boolean, jump: boolean, slide: boolean, kick: boolean } {
    const controls = { left: false, right: false, jump: false, slide: false, kick: false }
    
    switch (this.currentAction) {
      case "chase":
        return this.chaseAI(controls)
      case "attack":
        return this.attackAI(controls)
      case "defend":
        return this.defendAI(controls)
      default:
        return this.idleAI(controls)
    }
  }

  private chaseAI(controls: any): any {
    const ballPos = { x: this.ball.x, y: this.ball.y }
    const playerPos = { x: this.player.x, y: this.player.y }
    const ballVelocity = this.ball.getVelocity()
    
    // Predict ball position more smoothly
    const predictedBallX = ballPos.x + ballVelocity.x * 0.7
    const targetX = Phaser.Math.Linear(playerPos.x, predictedBallX, 0.12)
    const distanceToTarget = targetX - playerPos.x
    const deadZone = 15
    
    if (Math.abs(distanceToTarget) > deadZone) {
      if (distanceToTarget > 0) {
        controls.right = true
      } else {
        controls.left = true
      }
    }
    
    // Jump if ball is higher than the player and still in front
    if (ballPos.y < playerPos.y - 30 && Math.abs(ballPos.x - playerPos.x) < 120 && this.jumpTimer <= 0) {
      controls.jump = true
      this.jumpTimer = 900
    }
    
    // Kick when close to the ball
    if (Phaser.Math.Distance.Between(playerPos.x, playerPos.y, ballPos.x, ballPos.y) < 55 && this.kickTimer <= 0) {
      controls.kick = true
      this.kickTimer = 650
    }
    
    return controls
  }

  private attackAI(controls: any): any {
    const ballPos = { x: this.ball.x, y: this.ball.y }
    const playerPos = { x: this.player.x, y: this.player.y }
    const opponentPos = { x: this.opponent.x, y: this.opponent.y }
    
    // Earlier decision and smoother movement toward the ball
    const predictedBallX = ballPos.x + this.ball.getVelocity().x * 0.6
    const targetX = Phaser.Math.Linear(playerPos.x, predictedBallX, 0.14)
    const distanceToTarget = targetX - playerPos.x
    const deadZone = 12
    
    if (Math.abs(distanceToTarget) > deadZone) {
      if (distanceToTarget > 0) {
        controls.right = true
      } else {
        controls.left = true
      }
    }
    
    if (ballPos.y < playerPos.y - 20 && Math.abs(ballPos.x - playerPos.x) < 130 && this.jumpTimer <= 0) {
      controls.jump = true
      this.jumpTimer = 750
    }
    
    const distanceToKick = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, ballPos.x, ballPos.y)
    if (distanceToKick < 65 && this.kickTimer <= 0) {
      controls.kick = true
      this.kickTimer = 550
    }
    
    const opponentToBall = Phaser.Math.Distance.Between(opponentPos.x, opponentPos.y, ballPos.x, ballPos.y)
    const playerToOpponent = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, opponentPos.x, opponentPos.y)
    if (opponentToBall < 80 && playerToOpponent < 90 && this.aggressiveness > Math.random() * 1.2) {
      controls.slide = true
    }
    
    return controls
  }

  private defendAI(controls: any): any {
    const ballPos = { x: this.ball.x, y: this.ball.y }
    const playerPos = { x: this.player.x, y: this.player.y }
    const ballVelocity = this.ball.getVelocity()
    
    // Determine own goal position
    const isRightSide = this.player.getPlayerSide() === "right"
    const ownGoalX = isRightSide ? this.scene.cameras.main.width * 0.9 : this.scene.cameras.main.width * 0.1
    const goalCenterY = this.scene.cameras.main.height * 0.7 // Assume ground level
    
    // Position between ball and goal
    const interceptX = (ballPos.x + ownGoalX) / 2
    const interceptY = goalCenterY
    
    // Move to intercept position
    if (Math.abs(playerPos.x - interceptX) > 30) {
      if (playerPos.x < interceptX) {
        controls.right = true
      } else {
        controls.left = true
      }
    }
    
    // Jump to intercept high balls
    if (ballPos.y < playerPos.y - 20 && ballVelocity.y < 0 && this.jumpTimer <= 0) {
      controls.jump = true
      this.jumpTimer = 1000
    }
    
    // Kick ball away from goal if close
    const distanceToBall = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, ballPos.x, ballPos.y)
    if (distanceToBall < 80 && this.kickTimer <= 0) {
      controls.kick = true
      this.kickTimer = 700
    }
    
    return controls
  }

  private idleAI(controls: any): any {
    const playerPos = { x: this.player.x, y: this.player.y }
    const ballPos = { x: this.ball.x, y: this.ball.y }
    
    const isRightSide = this.player.getPlayerSide() === "right"
    const centerX = this.scene.cameras.main.width * 0.5
    const strategicX = isRightSide ? centerX + 150 : centerX - 150
    
    const moveTargetX = Phaser.Math.Linear(playerPos.x, strategicX, 0.08)
    const distanceToTarget = moveTargetX - playerPos.x
    const deadZone = 20
    
    if (Math.abs(distanceToTarget) > deadZone) {
      if (distanceToTarget > 0) {
        controls.right = true
      } else {
        controls.left = true
      }
    }
    
    const distanceToBall = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, ballPos.x, ballPos.y)
    if (distanceToBall < 220 && Math.random() < 0.4) {
      const approachX = Phaser.Math.Linear(playerPos.x, ballPos.x, 0.1)
      const approachDistance = approachX - playerPos.x
      if (Math.abs(approachDistance) > 20) {
        if (approachDistance > 0) {
          controls.right = true
        } else {
          controls.left = true
        }
      }
    }
    
    return controls
  }

  public setDifficultyLevel(difficulty: "easy" | "medium" | "hard"): void {
    this.setDifficulty(difficulty)
  }
}