const http = require('http');
const { URL } = require('url');

const host = 'localhost';
const port = 3000;

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${host}:${port}`);

  // Маршрут /
  if (urlObj.pathname === '/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1>Привет, Октагон!</h1>');
    return;
  }

  // Маршрут /static
  if (urlObj.pathname === '/static') {
    const responseData = {
      header: 'Hello',
      body: 'Octagon NodeJS Test',
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(responseData));
    return;
  }

  // Маршрут /dynamic
  if (urlObj.pathname === '/dynamic') {
    const a = urlObj.searchParams.get('a');
    const b = urlObj.searchParams.get('b');
    const c = urlObj.searchParams.get('c');

    const aNum = Number(a);
    const bNum = Number(b);
    const cNum = Number(c);

    if (
      a === null ||
      b === null ||
      c === null ||
      Number.isNaN(aNum) ||
      Number.isNaN(bNum) ||
      Number.isNaN(cNum)
    ) {
      const errorResponse = {
        header: 'Error',
      };

      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(errorResponse));
      return;
    }

    const result = (aNum * bNum * cNum) / 3;

    const responseData = {
      header: 'Calculated',
      body: String(result),
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(responseData));
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found');
});

server.listen(port, host, () => {
  console.log(`Сервер запущен: http://${host}:${port}/`);
});