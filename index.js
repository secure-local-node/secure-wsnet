const shh = require('secret-handshake-over-hypercore')
const _Server = require('simple-websocket/server')
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
    this.commands = opts.commands || []
    this.capabilities = opts.capabilities || []
  }

  listen(port, cb) {
    this._server = new _Server({ port }, cb)
    this.onConnection = this._onConnection.bind(this)
    this.onListening = this._onListening.bind(this)
    this._server.on('connection', this.onConnection)
    this._server.on('listening', this.onListening)
    return this
  }

  _onConnection(conn) {
    const shhConnection = shh.connect(this.sharedKey, {
      connect: () => conn,
      capabilities: this.capabilities
    })
    this.emit('connection', shhConnection)
  }

  _onListening() {
    this.emit('listening')
  }

  close(cb) {
    console.log('close!')
    if (this.destroyed) {
      cb(new Error('Server is closed.'))
    }
    this.destroyed = true
    this._server.removeListener('connection', this.onConnection)
    this._server.removeListener('listening', this.onListening)
    this._server.close(() => this.emit('close'))
  }
}

module.exports = {
  createServer
}