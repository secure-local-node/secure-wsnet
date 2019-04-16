const shh = require('secret-handshake-over-hypercore')
const net = require('./')

const sharedKey = Buffer.from('12abf5a9165201b0d5f284d7d902f57b19ca0a6f974bcd8fcc3162c93b2b75f1', 'hex')

const server = net.createServer({
  sharedKey,
  capabilities: [
    shh.capability('auth'),
    shh.capability('read'),
  ]
})

server.listen(8000)
server.setMaxListeners(0)

server.on('connection', bob => {
  console.log('on connection')
  
  bob.on('error', console.error)
  bob.on('handshake', () => {
    console.log('bob handshake')
    bob.write('hello alice!!!')

    bob.on('data', (buf) => console.log(buf.toString()))
  })
})