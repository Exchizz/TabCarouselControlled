var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(1337, function() { });


var connection;


// create the server
wsServer = new WebSocketServer({
  httpServer: server
});



process.stdin.resume();
process.stdin.setEncoding('utf8');


function sendCMD(cmd){
  var json = JSON.stringify({ cmd: cmd });
	console.log(json);
  connection.sendUTF(json);
  return json;
}

process.stdin.on('data', function (chunk) {
  chunk = chunk.trim();
  if(chunk == "s"){
	  console.log("Starting carousel");
	  sendCMD("start")
  }

  if(chunk == 'S'){
	  console.log("Stopping carousel");
	  sendCMD("stop")
  }


  if(chunk == 'n'){
	  console.log("Next ");
	  sendCMD("next");
  }

  if(chunk == 'p'){
	  console.log("Prev ");
	  sendCMD("prev");
  }

});



// WebSocket server
wsServer.on('request', function(request) {
  connection = request.accept(null, request.origin);
  console.log("New connection..");
  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      // process WebSocket message
    }
  });

  connection.on('close', function(connection) {
	 console.log("Connection closed");
    // close user connection
  });
});
