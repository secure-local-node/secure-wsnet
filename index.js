const { Connection, capability } = require('secret-handshake-over-hypercore')
const { EventEmitter } = require('events')
const WebSocketServer = require('simple-websocket/server')
const WebSocket = require('simple-websocket')
const https = require('https')
const url = require('url')
const ip = require('ip')

function createServer(opts, cb) {
  const server = new Server(opts)

  if ('function' === typeof cb) {
    server.on('connection', cb)
  }

  return server
}

function connect(port, host, opts, cb) {
  if ('function' === typeof host) {
    cb = host
    host = undefined
  }

  if (host && 'object' === typeof host) {
    opts = host
    host = undefined
  }

  if ('function' === typeof opts) {
    cb = opts
    opts = {}
  }

  if (port && 'object' === typeof port) {
    opts = port
    port = undefined
  }

  if (host && 'function' === typeof host) {
    cb = host
    host = undefined
  }

  if (undefined === host && undefined !== opts.host) {
    host = opts.host
  }

  if (undefined === port && undefined !== opts.port) {
    port = opts.port
  }

  const socket = new Socket(opts)
  socket.connect(port, host, cb)
  return socket
}

class Server extends EventEmitter {
  constructor(opts) {
    super()

    if (opts === null || typeof opts !== 'object') {
      opts = {}
    }

    if (!opts.sharedKey || !Buffer.isBuffer(opts.sharedKey)) {
      throw new TypeError('A sharedKey buffer is required.')
    }

    this.destroyed = false

    this.opts = Object.assign({}, opts)
    this.sharedKey = opts.sharedKey
    this.capabilities = opts.capabilities || []

    delete this.opts.sharedKey
    delete this.opts.capabilities

    this.onconnection = this.onconnection.bind(this)
    this.onlistening = this.onlistening.bind(this)
    this.onclose = this.onclose.bind(this)
    this.onerror = this.onerror.bind(this)
  }

  address() {
    if (this.webSocketServer) {
      const { protocol } = this
      const addrinfo = this.webSocketServer.address()
      if (addrinfo) {
        return Object.assign({ protocol }, addrinfo)
      }
    }

    return null
  }

  listen(port, host, cb) {
    let opts = {}
    let protocol = 'ws:'

    if ('function' === typeof port) {
      cb = port
      port = 0
    }

    if ('string' === typeof port) {
      cb = host
      host = port
      port = 0
    }

    if ('function' === typeof host) {
      cb = host
      host = undefined
    }

    if (port && 'object' === typeof port) {
      opts = port
      port = undefined
    } else if (undefined !== port && host && 'object' === typeof host) {
      opts = host
      host = undefined
    }

    if (this.webSocketServer) {
      const err = new Error('Already listening')
      if ('function' === typeof cb) {
        cb(err)
        return this
      } else {
        this.emit('error',err)
        throw this
      }
    }

    Object.assign(opts, this.opts)

    if (undefined !== host) {
      opts.host = host
    }

    if (undefined !== port) {
      opts.port = port
    }

    if (!opts.port && undefined !== opts.host) {
      if (!/^wss?:/.test(opts.host)) {
        opts.host = `ws://${opts.host}`
      }
      const uri = url.parse(opts.host)
      opts.host = uri.hostname
      opts.port = parseInt(uri.port)
      protocol = uri.protocol
    }

    if ('wss:' === protocol && !opts.server) {
      const httpsServer = https.createServer(this.opts)
      opts.server = httpsServer
      httpsServer.listen(opts.port, opts.host)
    }

    if (opts.server) {
      // delete 'opts.host' and 'opts.port' so `WebSocketServer
      // does not start listening when these properties are present
      // and the http server is supplied
      delete opts.host
      delete opts.port
    }

    this.protocol = protocol
    this.webSocketServer = new WebSocketServer(opts)

    if ('function' === typeof cb) {
      this.webSocketServer.once('error', cb)
      this.webSocketServer.once('listening', () => {
        this.webSocketServer.removeListener('error', cb)
        cb(null)
      })
    }

    this.webSocketServer.on('connection', this.onconnection)
    this.webSocketServer.on('listening', this.onlistening)
    this.webSocketServer.on('close', this.onclose)
    this.webSocketServer.on('error', this.onerror)

    return this
  }

  close(cb) {
    if (this.destroyed) {
      if ('function' === typeof cb) {
        cb(new Error('Server is closed.'))
      }

      return this
    }

    this.destroyed = true
    this.webSocketServer.removeListener('connection', this.onconnection)
    this.webSocketServer.removeListener('listening', this.onlistening)
    this.webSocketServer.removeListener('close', this.onclose)
    this.webSocketServer.removeListener('error', this.onerror)
    this.webSocketServer.close(cb)
    this.webSocketServer = null
    this.emit('close')
    
    return this
  }

  onconnection(stream) {
    const { sharedKey, capabilities } = this
    const socket = new Socket({
      sharedKey,
      stream,
      capabilities: capabilities.map((c) => {
        return Buffer.isBuffer(c) ? c : capability(c)
      })
    })

    socket.connect()
    socket.on('error', this.onerror)
    socket.on('close', () => {
      this.close()
    })
    this.emit('connection', socket)
  }

  onlistening() {
    this.emit('listening')
  }

  onclose() {
    this.emit('close')
  }

  onerror(err) {
    this.emit('error', err)
  }
}

class Socket extends Connection {
  constructor(opts) {
    super(opts)
  }

  get localAddress() {
    if ('undefined' !== typeof window) {
      return window.location.hostname
    }

    return null
  }

  get localPort() {
    if ('undefined' !== typeof window) {
      const port = parseInt(window.location.port)

      if (port) {
        return port
      }

      return 'https:' === window.location.protocol ? 443 : 80
    }

    return null
  }

  connect(port, host, cb) {
    let protocol = 'ws:'
    let opts = {}

    if (port && typeof port === 'object') {
      opts = port
      cb = host
      port = undefined
      host = undefined
    }

    if (host && 'object' === typeof host) {
      opts = host
      port = undefined
      host = undefined
    }

    if ('port' in opts) {
      port = opts.port
    }

    if ('host' in opts) {
      host = opts.host
    }

    if ('protocol' in opts) {
      protocol = opts.protocol
    }

    if (typeof host === 'function') {
      cb = host
      host = undefined
    }

    if ('string' === typeof port) {
      host = port
    }

    if (!host) {
      if ('undefined' !== typeof window) {
        host = window.location.hostname
        if ('https:' === window.location.protocol) {
          protocol = 'wss:'
        }
      } else {
        host = 'localhost'
      }
    } else {
      const uri = url.parse(host)
      if (uri.hostname) {
        host = uri.hostname
      }

      if (uri.port){
        port = parseInt(uri.port)
      }

      if (uri.protocol) {
        protocol = uri.protocol
      }
    }

    if (host && port) {
      this.webSocket = new WebSocket(`${protocol}//${host}:${port}`)
      this.createConnection = () => this.webSocket
    }

    process.nextTick(() => super.connect(cb))

    this.once('connect', () => {
      this.remoteAddress = host
      this.remoteFamily = ip.isV6Format(host) ? 'IPv6' : 'IPv4'
      this.remotePort = port
    })

    return this
  }
}

module.exports = {
  createServer,
  connect,
  Server,
  Socket
}
