const http = require('http');

const host = 'localhost';
const port = 3000;

const requestListener = (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<h1>Привет, Октагон!</h1>');
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
  console.log(`Сервер запущен: http://${host}:${port}/`);
});