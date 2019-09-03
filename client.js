const net = require('net');

var client = new net.Socket();
client.connect(8888, 'localhost', function() {
	console.log('Connected');
	client.write('Hello, server! Love, Client.');
});

client.on('data', function(data) {
	console.log('Received: ' + data);
});

client.on('close', function() {
	console.log('Connection closed');
});


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


