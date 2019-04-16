const shh = require('secret-handshake-over-hypercore')
const net = require('./')

const sharedKey = Buffer.from('12abf5a9165201b0d5f284d7d902f57b19ca0a6f974bcd8fcc3162c93b2b75f1', 'hex')

const alice = net.connect(8000, 'ws://localhost', {
  preserveSender: true,
  sharedKey,
  capabilities: [
    shh.capability('auth'),
    shh.capability('read'),
  ]
}, _ => {
  console.log('callback')
})

alice.on('handshake', () => {
  console.log('alice handshake')
  alice.write('hello bob')
  alice.on('data', (b) => console.log(b.toString()))
  alice.sender.get(0, console.log)
})