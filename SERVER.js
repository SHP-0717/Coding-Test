// server node.js
const http = require('http');
const fs = require('fs');
let data;
fs.readfile("index.html", "utf-8", (err, data) => {if (err){console.error(err);return;}data=data;});
function start_server(port=8080){
  const server=http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(data);
  });
  server.listen(port, ()=>{console.log(`localhost:${port}/`);});
}
start_server(8080);
