const { Socket } = require('net');
const { Duplex } = require('stream');

const bufferLength = 65536;

class SocketWrapper extends Duplex {

  constructor(socket) {
    super({ objectMode: true });
    
    this._readingPaused = false;

    this._socket;
    if (socket) this._wrapSocket(socket);
  }

  connect(host, port) {
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
      if (this._remainingBuffer) {
        // console.log('FILL REMEINING BUFFER')
        const { expectedBytes, buffer } = this._remainingBuffer;
        let expectedBuffer = this._socket.read(expectedBytes);
        const fullBuffer = Buffer.concat([buffer, expectedBuffer]);
        // console.log(fullBuffer.toString('utf8'));
        delete this._remainingBuffer;
        this.push(fullBuffer);
      }

      let lenBuf = this._socket.read(4);
      if (!lenBuf) return;

      let len = lenBuf.readUInt32BE();
      // console.log('get message with length', len, this._socket.bytesRead);


      if (len >= bufferLength) {
        // console.log('exceeded amount of bytes, read remaining buffer');
        let remeiningBuffer = this._socket.read(len-4);
        // console.log('remaining body:', remeiningBuffer);
        this._remainingBuffer = {
          buffer: remeiningBuffer,
          expectedBytes: len - (len - 4)
        }
        return;
      }

      let body = this._socket.read(len);

      if (!body) {
        this._socket.unshift(lenBuf);
        return;
      }

      const resultString = body.toString('utf8');
      // console.log('send body:', resultString)
      let pushOk = this.push(resultString);

      if (!pushOk) this._readingPaused = true;
    }
  }

  _write (str, encoding, cb) {
    // or simply toLongString.length
    let strBytes = Buffer.byteLength(str, 'utf8');
    let buffer = Buffer.alloc(4 + strBytes);
    buffer.writeUInt32BE(strBytes);
    buffer.write(str, 4);
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