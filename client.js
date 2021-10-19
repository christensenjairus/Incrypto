const net = require('net');
const readline = require('readline');

const client = new net.Socket();
client.connect(5002, process.argv[2], "gibberish", "something else", () => {
  // process.stdout.write('Connected to server');
});
client.on('data', (data) => {
  process.stdout.write(data);
});

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  if (line == "clear") {
    client.write("() clear");
  } else if (line == "fill") {
    client.write("() fill");
  } else {
    client.write(`${line}`);
  }
});
rl.on('close', () => {
  client.end();
});


























// function getGibberish (){
//     const url='https://jsonplaceholder.typicode.com/posts';
//     Http.open("GET", url);
//     Http.send();

//     Http.onreadystatechange = (e) => {
//     console.log(Http.responseText)
//     }
// }