const shh = require('secret-handshake-over-hypercore')
const _Server = require('simple-websocket/server')
const inherits = require('inherits')
const events = require('events')

inherits(Server, events.EventEmitter)

function createServer(opts, cb) {
  return new Server(opts, cb)
}

function Server(opts, cb) {
  if (!(this instanceof Server)) {
    return new Server(opts, cb)
  }

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

  this._server = new _Server(opts)

  this.commands = opts.commands || []
  this.capabilities = opts.capabilities || []
  this.sharedKey = opts.sharedKey

  this._server.on('connection', (socket) => {
    const shhConnection = shh.connect(this.sharedKey, {
      connect: () => socket,
      capabilities: this.capabilities
    })
    this.emit('connection', shhConnection)
  })
}

module.exports = {
  createServer
}