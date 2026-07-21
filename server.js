import { createServer as createViteServer } from 'vite'
import { readFile } from 'fs/promises'
import http from 'http'
import path from 'path'
import os from 'os'
import dgram from 'dgram'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const requestedPort = Number(process.env.PORT || 5173)
let serverPort = requestedPort
const controllerPath = path.join(__dirname, 'public', 'controller.html')

const controlState = {
  p1: { left: false, right: false, jump: false, slide: false, kick: false },
  p2: { left: false, right: false, jump: false, slide: false, kick: false },
}

const clients = new Set()
const udpSocket = dgram.createSocket('udp4')

function advertiseServer() {
  const message = Buffer.from(`FOOTBALL_GAME_SERVER:${getLocalIp()}:${serverPort}`)
  udpSocket.send(message, 41234, '255.255.255.255', (error) => {
    if (error) {
      console.warn('⚠️ Could not broadcast controller discovery', error)
    }
  })
}

function getLocalIp() {
  const interfaces = os.networkInterfaces()
  for (const values of Object.values(interfaces)) {
    for (const entry of values || []) {
      if (!entry.internal && entry.family === 'IPv4') {
        return entry.address
      }
    }
  }
  return 'localhost'
}

function broadcastControl(payload) {
  const message = `event: control\ndata: ${JSON.stringify(payload)}\n\n`
  for (const client of Array.from(clients)) {
    try {
      if (!client.writableEnded) {
        client.write(message)
      }
    } catch (error) {
      clients.delete(client)
    }
  }
}

function normalizePlayer(player) {
  const normalized = String(player || '').toLowerCase()
  if (normalized === 'p2' || normalized === 'player2' || normalized === 'player-2' || normalized === '2') {
    return 'p2'
  }
  return 'p1'
}

function sendJson(res, statusCode, payload) {
  if (res.headersSent) {
    return
  }

  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

async function serveController(res) {
  const html = await readFile(controllerPath, 'utf8')
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(html)
}

const vite = await createViteServer({
  root: __dirname,
  server: {
    host: '0.0.0.0',
    port: requestedPort,
    open: false,
  },
  appType: 'spa',
})

async function handleControllerRequest(req, res) {
  if (!req.url) {
    return false
  }

  const requestUrl = new URL(req.url, 'http://localhost')

  if (requestUrl.pathname === '/controller' || requestUrl.pathname === '/controller.html') {
    await serveController(res)
    return true
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value)
    })
    res.end()
    return true
  }

  if (requestUrl.pathname === '/api/controls') {
    if (req.method === 'GET') {
      res.statusCode = 200
      Object.entries({ ...corsHeaders, 'Content-Type': 'application/json' }).forEach(([key, value]) => {
        res.setHeader(key, value)
      })
      res.end(JSON.stringify({ ok: true, state: controlState }))
      return true
    }

    if (req.method === 'POST') {
      let body = ''
      req.setEncoding('utf8')
      req.on('data', chunk => { body += chunk })
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body || '{}')
          const player = normalizePlayer(parsed.player)
          const action = parsed.action
          const value = Boolean(parsed.value)
          if (action && typeof controlState[player][action] === 'boolean') {
            controlState[player][action] = value
            const payload = { type: 'control', player, action, value }
            broadcastControl(payload)
            await sendJson(res, 200, { ok: true, state: controlState[player] })
          } else {
            await sendJson(res, 400, { ok: false, error: 'Invalid control payload' })
          }
        } catch (error) {
          console.error('POST /api/controls failed', error)
          await sendJson(res, 400, { ok: false, error: 'Invalid JSON' })
        }
      })
      return true
    }
  }

  if (requestUrl.pathname === '/api/state') {
    res.statusCode = 200
    Object.entries({ ...corsHeaders, 'Content-Type': 'application/json' }).forEach(([key, value]) => {
      res.setHeader(key, value)
    })
    res.end(JSON.stringify({ ok: true, state: controlState }))
    return true
  }

  if (requestUrl.pathname === '/events') {
    res.statusCode = 200
    Object.entries({
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    }).forEach(([key, value]) => {
      res.setHeader(key, value)
    })
    res.write('event: connected\ndata: {"status":"connected"}\n\n')
    clients.add(res)
    req.on('close', () => clients.delete(res))
    return true
  }

  return false
}

udpSocket.bind(() => {
  udpSocket.setBroadcast(true)
  setInterval(advertiseServer, 1000)
})

const server = http.createServer(async (req, res) => {
  try {
    if (await handleControllerRequest(req, res)) {
      return
    }

    vite.middlewares(req, res, () => {
      if (!res.headersSent) {
        res.statusCode = 404
        res.end('Not found')
      }
    })
  } catch (error) {
    console.error('Controller middleware failed', error)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: false, error: 'Internal server error' }))
    }
  }
})

await new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(requestedPort, '0.0.0.0', () => {
    server.off('error', reject)
    resolve()
  })
})

serverPort = server.address().port

const localIp = getLocalIp()
console.log(`✅ Phone controller server ready`)
console.log(`   Game URL: http://localhost:${serverPort}`)
console.log(`   Phone controller: http://${localIp}:${serverPort}/controller.html`)
