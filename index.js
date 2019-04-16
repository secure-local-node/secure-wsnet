const shh = require('secret-handshake-over-hypercore')
const _Server = require('simple-websocket/server')
const WebSocket = require('simple-websocket')
const { EventEmitter } = require('events')

function createServer(opts, cb) {
  const server = new Server(opts)
  if ('function' === typeof cb) { server.on('connection', cb) }
  return server
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

    this.sharedKey = opts.sharedKey
    this.capabilities = opts.capabilities || []
  }

  listen(port, opts, cb) {
    this._server = new _Server(Object.assign({ port }, opts))
    this.onConnection = this._onConnection.bind(this)
    this.onListening = this._onListening.bind(this)
    this._server.on('connection', this.onConnection)
    this._server.on('listening', this.onListening)
    return this
  }

  _onConnection(conn) {
    const socket = new Socket({
      sharedKey: this.sharedKey,
      connect: () => conn,
      capabilities: this.capabilities
    }).connect()
    this.emit('connection', socket)
  }

  _onListening() {
    this.emit('listening')
  }

  close(cb) {
    if (this.destroyed) {
      cb(new Error('Server is closed.'))
    }
    this.destroyed = true
    this._server.removeListener('connection', this.onConnection)
    this._server.removeListener('listening', this.onListening)
    this._server.close(() => this.emit('close'))
  }
}

class Socket extends shh.Connection {
  constructor(opts) {
    super(opts)
  }

  connect(port, host, cb) {
    let opts
    if (typeof port === 'object') {
      opts = port
      port = opts.port
      host = opts.host
    }

    if (typeof host === 'function') {
      cb = host
    }

    if (host && port) {
      this.websocket = new WebSocket(`${host}:${port}`)
      this.createConnection = () => this.websocket
    }
    process.nextTick(() => super.connect(cb))
    return this
  }
}

function connect(port, host, opts, cb) {
  return new Socket(opts).connect(port, host, cb)
}

module.exports = {
  createServer,
  connect,
  Server,
  Socket
}