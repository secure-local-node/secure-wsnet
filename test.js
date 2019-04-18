const shh = require('secret-handshake-over-hypercore')
const test = require('tape')
const net = require('./')

const sharedKey = Buffer.from('12abf5a9165201b0d5f284d7d902f57b19ca0a6f974bcd8fcc3162c93b2b75f1', 'hex')
const HOST = 'ws://localhost'
const PORT = 8000

test('createServer', (t) => {
  t.throws(() => net.createServer(), Error)
  t.throws(() => net.createServer(null), Error)
  t.throws(() => net.createServer(Buffer.alloc(0)), Error)
  t.throws(() => net.createServer(Buffer.from('')), Error)
  t.throws(() => net.createServer(sharedKey), Error)

  const server = net.createServer({ sharedKey }, _ => {
    t.pass('on connection')
  })

  server.listen(PORT)

  server.on('connection', socket => {
    t.ok(socket instanceof net.Socket, 'socket')
  })

  const client = net.connect(PORT, HOST, {
    preserveSender: true,
    sharedKey
  }, _ => {
    t.pass('handshake complete')
    client.close()
    server.close(() => t.end())
  })
})

test('createServer client insufficient capabilities', (t) => {
  const server = net.createServer({
    sharedKey,
    capabilities: [
      shh.capability('auth'),
      shh.capability('read'),
    ]
  })

  server.listen(PORT)

  server.on('error', error => {
    t.ok(error instanceof Error, 'server failed')
  })

  server.on('close', () => {
    client.close()
  })

  const client = net.connect(PORT, HOST, {
    preserveSender: true,
    sharedKey
  }, (error) => {
    t.ok(error instanceof Error, 'client failed')
  })

  client.on('close', () => {
    t.end()
  })
})

test('createServer server insufficient capabilities', (t) => {
  const server = net.createServer({ sharedKey })

  server.listen(PORT)

  server.on('error', error => {
    t.ok(error instanceof Error, 'server failed')
  })

  const client = net.connect(PORT, HOST, {
    preserveSender: true,
    sharedKey,
    capabilities: [
      shh.capability('auth'),
      shh.capability('read'),
    ]
  }, error => {
    t.ok(error instanceof Error, 'client failed')
    client.close()
  })

  client.on('close', () => {
    server.close(() => t.end())
  })
})