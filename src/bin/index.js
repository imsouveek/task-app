/*
  Load and start server. The idea with this script is to ensure that all
  application logic, including definition of server and routes, is completely
  independent of the script that actually starts the server
*/

/*
  Relying on node http module for server. This is what express-generator
  does and it allows us to easily move from http to https with few changes
*/
const http = require('http');

// Load Application entry point
const app = require('../app');

// Identify port. Note that we expect this program to run on a port, not a pipe
const port = process.env.PORT;

// Create and start Server
const server = http.createServer(app);
server.listen(port);

// Error handling
server.on('error', (err) => console.log(err));
server.on('listening', () => {
  console.log(`Server listening on port ${port}`);
});
