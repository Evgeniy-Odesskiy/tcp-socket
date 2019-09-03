const net = require('net');
const SocketWrapper = require('./socket-wrapper');

const port = 8888;


var client = new SocketWrapper();
client.on('connect', function() {
  console.log('Connected');
	client.write('Hello, server! Love, Client.');
});

client.on('data', function(data) {
	console.log('Received: ' + data);
});

client.on('close', function() {
	console.log('Connection closed');
});

client.connect('localhost', port);


// Input

const stdin = process.openStdin();

stdin.addListener("data", function(d) {
  const inputVal = d.toString().trim();
  // console.log("you entered: [" + 
  //     inputVal + "]");
  client.write(inputVal);
});

// var readline = require('readline');
// var rl = readline.createInterface(process.stdin, process.stdout);
// rl.setPrompt('guess> ');
// rl.prompt();
// rl.on('line', function(line) {
//     if (line === "right") rl.close();
//     client.write(line);
//     rl.prompt();
// }).on('close',function(){
//     process.exit(0);
// });


