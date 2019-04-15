const shh = require('secret-handshake-over-hypercore')
const _Server = require('simple-websocket/server')
const { EventEmitter } = require('events')

function createServer(opts, cb) {
  return new Server(opts, cb)
}

class Server extends EventEmitter {
  constructor(opts, cb) {
    super()

    if (typeof opts === 'function') {
      cb = opts;
      opts = {};
    } else if (opts == null || typeof opts === 'object') {
      opts = opts || {};
    }

    if (!opts.sharedKey || !Buffer.isBuffer(opts.sharedKey)) {
      throw new TypeError('A sharedKey buffer is required.')
    }

    if (typeof cb === 'function') {
      this.on('connection', cb);
    }

    this.port = opts.port || 8000
    this.sharedKey = opts.sharedKey

    this.commands = opts.commands || []
    this.capabilities = opts.capabilities || []
  }

  listen() {
    this._server = new _Server({ port: this.port })

    this._server.on('connection', this._onConnection.bind(this))
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