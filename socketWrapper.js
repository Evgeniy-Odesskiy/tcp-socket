const { Socket } = require('net');
const { Duplex } = require('stream');


class SocketWrapper extends Duplex {

  constructor(socket) {
    super({ objectMode: true });
    
    this._readingPaused = false;

    this._socket;
    if (socket) this._wrapSocket(socket);
  }

  connect({ host, port }) {
    this._wrapSocket(new Socket());
    this._socket.connect({ host, port });
    return this;
  }

  _wrapSocket(socket) {
    this._socket = socket;
    this._socket.on('close', hadError => this.emit('close', hadError));
    this._socket.on('connect', () => this.emit('connect'));
    this._socket.on('drain', () => this.emit('drain'));
    this._socket.on('end', () => this.emit('end'));
    this._socket.on('error', err => this.emit('error', err));
    this._socket.on('lookup', (err, address, family, host) => this.emit('lookup', err, address, family, host)); // prettier-ignore
    this._socket.on('ready', () => this.emit('ready'));
    this._socket.on('timeout', () => this.emit('timeout'));
    this._socket.on('readable', this._onReadable.bind(this));
  }

  _onReadable() {
    while (!this._readingPaused) {
      let lenBuf = this._socket.read(4);
      if (!lenBuf) return;

      let len = lenBuf.readUInt32BE();

      if (len > 2 ** 18) {
        this.socket.destroy(new Error('Max length exceeded'));
        return;
      }

      let body = this._socket.read(len);

      if (!body) {
        this._socket.unshift(lenBuf);
        return;
      }

      let json;
      try {
        json = JSON.parse(body);
      } catch (ex) {
        this.socket.destroy(ex);
        return;
      }

      let pushOk = this.push(json);

      if (!pushOk) this._readingPaused = true;
    }
  }

  _write(obj, encoding, cb) {
    let json = JSON.stringify(obj);
    let jsonBytes = Buffer.byteLength(json);
    let buffer = Buffer.alloc(4 + jsonBytes);
    buffer.writeUInt32BE(jsonBytes);
    buffer.write(json, 4);
    this._socket.write(buffer, cb);
  }

  _read() {
    this._readingPaused = false;
    setImmediate(this._onReadable.bind(this));
  }

  _final(cb) {
    this._socket.end(cb);
  }
}

module.exports = SocketWrapper;