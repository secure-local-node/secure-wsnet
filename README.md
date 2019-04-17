secure-wsnet
============

A secure websocket server and client network interface built on top of
[secret-handshake-over-hypercore](https://github.com/secure-local-node/secret-handshake-over-hypercore)
to enable end-to-end encryption over web sockets.

## Installation

```sh
$ npm install secure-wsnet
```

## Usage

```js
const wsnet = require('secure-wsnet')
const sharedKey = Buffer.from('12abf5a9165201b0d5f284d7d902f57b19ca0a6f974bcd8fcc3162c93b2b75f1', 'hex')
const server = wsnet.createServer({ sharedKey }).listen(3000)
server.on('connection', (socket) => {
  socket.write('hello')
})

const socket = wsnet.connect(3000, { sharedKey })
socket.on('data', (data) => {
  console.log(data.toString()) // 'hello'
})
```

## API

### `server = new wsnet.Server(opts)`

Creates a web socket server where `opts` can be:

* `opts.sharedKey` is the shared key given to
  [secret-handshake-over-hypercore][secret-handshake-over-hypercore]
* `opts.capabilities` is an array of capabilities given to
  [secret-handshake-over-hypercore][secret-handshake-over-hypercore]

The rest of the `opts` are passed directly to the [simple-websocket
server](https://github.com/feross/simple-websocket#server).

```js
const server = new wsnet.Server(opts)
```

### `server = wsnet.createServer(opts[, onconnection])`

Where `opts` is passed to `new wsnet.Server(opts)` and then `onconnection`
callback will be called when the `'connection'` event is emitted.

```js
const server = wsnet.createServer(opts, onconnection)
server.listen(3000, '127.0.0.68', (err) => {
  if (err) {
    // handle error
  } else {
    console.log(server.address()) // { address: '127.0.0.68', family: 'IPv4', port: 3000 }
  }
})

function onconnection(conn) {
  conn.write('hello')
}
```


#### `addrinfo = server.address()`

Returns the `address`, `family`, and `port` that the server is bound to.

```js
console.log(server.address()) // { address: '127.0.0.68', family: 'IPv4', port: 3000 }
```

#### `server.listen(port[, hostname[, onlistening]])`

Listen on a specified port on an optional host. The `onlistening(err)`
callback will be called with on error or when the servers `'listening'`
event has been emitted.

```js
server.listen(3000, 'localhost', (err) => {
  if (err) {
    // handle error
  } else {
    const { address, port, protocol } = server.address()
    console.log('listening on %s//%s:%s', protocol, address, port)
  }
})
```

#### `server.listen(host[, onlistening]])`

Listen on a specified host that can contain both the hostname and port
as a URI like `ws:///localhost:3000`.

```js
server.listen('ws://localhost:3000', (err) => {
  if (err) {
    // handle error
  } else {
    const { address, port, protocol } = server.address()
    console.log('listening on %s//%s:%s', protocol, address, port)
  }
})
```

#### `server.listen(opts[, onlistening]])`

Listen based on options `opts` that are passed directly to the [simple-websocket
server](https://github.com/feross/simple-websocket#server). The
`onlistening(err)` callback will be called with on error or when the
servers `'listening'` event has been emitted.

```js
server.listen({ port: 3000, host: 'localhost' }, (err) =>} {
  if (err) {
    // handle error
  } else {
    const { address, port, protocol } = server.address()
    console.log('listening on %s//%s:%s', protocol, address, port)
  }
})
```

### `socket = new wsnet.Socket(opts)`

Creates a new secure web socket where `opts` can be

* `opts.sharedKey` is the shared key given to
  [secret-handshake-over-hypercore][secret-handshake-over-hypercore]
* `opts.capabilities` is an array of capabilities given to
  [secret-handshake-over-hypercore][secret-handshake-over-hypercore]

The rest of the `opts` are passed directly to
[secret-handshake-over-hypercore's Connection() constructor](
https://github.com/secure-local-node/secret-handshake-over-hypercore#connection--new-shhconnectionopts
).


```js
const socket = new wsnet.Socket(opts)
```

#### `socket.localAddress`

The local address of the `Socket`.

#### `socket.localPort`

The local port of the `Socket`.

#### `socket.remoteAddress`

The remote address of the `Socket` connection.  This value is populated
after the `'connect'` event.

#### `socket.remoteFamily`

The remote family of the `Socket` connection.  This value is populated
after the `'connect'` event.

#### `socket.remotePort`

The remote port of the `Socket` connection.  This value is populated
after the `'connect'` event.

#### `socket.connect(port[, hostname[, onconnect]])`

Connect to a host specified by `port` and `hostname` calling
`onconnect(err)` when connected to the host.

```js
socket.connect(3000, 'localhost', (err) => {
  if (err) {
    // handle error
  }
})
```

### `socket = wsnet.connect(port[, hostname], opts[, onconnect])`

Connect to a host specified by `port` and `hostname`. If you do not
provide a `hostname` and `window.location.hostname` will be used if you
are in a browser otherwise `'localhost'`.

```js
const socket = wsnet.connect(3000, 'localhost', opts, (err) => {
  if (err) {
    // handle error
  }
})
```

### `socket = wsnet.connect(port, opts[, onconnect])`

Connect to `'localhost'` or `opts.host` at `port`.

```js
const socket = wsnet.connect(3000, opts, (err) => {
  if (err) {
    // handle error
  }
})
```

### `socket = wsnet.connect(opts[, onconnect])`

Connect to a host specified by `opts.host` and `opts.port`.

```js
const socket = wsnet.connect(opts, (err) => {
  if (err) {
    // handle error
  }
})
```

## License

MIT


[secret-handshake-over-hypercore]: https://github.com/secure-local-node/secret-handshake-over-hypercore
