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

    this.sharedKey = opts.sharedKey

    this.commands = opts.commands || []
    this.capabilities = opts.capabilities || []
  }

  listen(port, cb) {
    this._server = new _Server({ port }, cb)
    this._server.on('connection', this._onConnection.bind(this))
    return this
  }

  _onConnection (conn) {
    const shhConnection = shh.connect(this.sharedKey, {
      connect: () => conn,
      capabilities: this.capabilities
    })
    this.emit('connection', shhConnection)
  }
}

module.exports = {
  createServer
}