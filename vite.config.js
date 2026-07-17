import { defineConfig } from "vite"
import { WebSocketServer } from "ws"
import dgram from "dgram"
import os from "os"

// State for both players
const gameState = {
  player1: { left: false, right: false, up: false, down: false, kick: false },
  player2: { left: false, right: false, up: false, down: false, kick: false }
}

const controllerClients = new Set()

function broadcastGameState() {
  const payload = JSON.stringify(gameState)
  for (const client of controllerClients) {
    if (client.readyState === 1) {
      client.send(payload)
    }
  }
}

function startDiscoveryBroadcaster(port) {
  const server = dgram.createSocket("udp4")
  const broadcastAddress = "255.255.255.255"
  const discoveryPort = 41234
  
  server.on("error", (err) => {
    console.error(`Discovery error: ${err.stack}`)
    server.close()
  })

  server.bind(() => {
    server.setBroadcast(true)
    setInterval(() => {
      const interfaces = os.networkInterfaces()
      let localIp = "localhost"
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === "IPv4" && !iface.internal) {
            localIp = iface.address
            break
          }
        }
      }
      const message = Buffer.from(`FOOTBALL_GAME_SERVER:${localIp}:${port}`)
      server.send(message, 0, message.length, discoveryPort, broadcastAddress)
    }, 3000)
  })
}

const controllerApiPlugin = {
  name: "controller-api",
  configureServer(server) {
    const wss = new WebSocketServer({ noServer: true })
    const port = server.config.server.port || 8080
    
    startDiscoveryBroadcaster(port)

    server.httpServer?.on("upgrade", (req, socket, head) => {
      const url = new URL(req.url || "/", "http://localhost")
      if (url.pathname !== "/ws/controller") return

      wss.handleUpgrade(req, socket, head, (ws) => {
        controllerClients.add(ws)
        ws.send(JSON.stringify(gameState))

        ws.on("message", (rawMessage) => {
          try {
            const data = JSON.parse(rawMessage.toString())
            const player = data.player === "player2" ? "player2" : "player1"
            const action = data.action
            const value = Boolean(data.value)

            if (action in gameState[player]) {
              gameState[player][action] = value
              broadcastGameState()
            }
          } catch (e) {}
        })

        ws.on("close", () => controllerClients.delete(ws))
      })
    })

    // HTTP Fallback
    server.middlewares.use("/api/controller-state", (req, res, next) => {
      const url = new URL(req.url || "/", "http://localhost")
      const player = url.searchParams.get("player") === "player2" ? "player2" : "player1"
      const action = url.searchParams.get("action")
      const value = url.searchParams.get("value") === "1"

      if (action && action in gameState[player]) {
        gameState[player][action] = value
        broadcastGameState()
      }
      res.end(JSON.stringify(gameState))
    })
  },
}

export default defineConfig({
  base: "",
  server: { host: "0.0.0.0", port: 8080, hmr: false },
  plugins: [controllerApiPlugin]
})
