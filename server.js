const Net = require('net');
const SocketWrapper = require('./socket-wrapper')

const port = 8888;

const clients = [];


const server = new Net.Server(socket => {
	socket = new SocketWrapper(socket);
	
	console.log('A new connection has been established.');
	clients.push(socket)

	socket.write('Hello, client.');

	socket.on('data', function(chunk) {
		const message = chunk.toString();
		clients.forEach(client => {
			if (client === socket) return;
			client.write(message);
			client.write(message);
		})	
		// console.log(`Data received from client: ${message}.`)
	});

	socket.on('end', function() {
		console.log('Closing connection with the client');
	});

	socket.on('error', function(err) {
		console.log(`Error: ${err}`);
	});
});

server.listen(port, function() {
	console.log(`Server listening for connection requests on socket localhost:${port}.`);
});