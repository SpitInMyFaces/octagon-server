const http = require('http');
const { URL } = require('url');
const mysql = require('mysql2');

const host = 'localhost';
const port = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ChatBotTests'
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err.message);
  } else {
    console.log('Connected to MySQL');
  }
});

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });
  req.on('end', () => {
    callback(body);
  });
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${host}:${port}`);
  const path = urlObj.pathname;

  if (path === '/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1>Привет, Октагон!</h1>');
    return;
  }

  if (path === '/static') {
    sendJson(res, 200, {
      header: 'Hello',
      body: 'Octagon NodeJS Test'
    });
    return;
  }

  if (path === '/dynamic') {
    const a = urlObj.searchParams.get('a');
    const b = urlObj.searchParams.get('b');
    const c = urlObj.searchParams.get('c');

    const aNum = Number(a);
    const bNum = Number(b);
    const cNum = Number(c);

    if (
      a === null || b === null || c === null ||
      Number.isNaN(aNum) || Number.isNaN(bNum) || Number.isNaN(cNum)
    ) {
      sendJson(res, 400, { header: 'Error' });
      return;
    }

    const result = (aNum * bNum * cNum) / 3;
    sendJson(res, 200, {
      header: 'Calculated',
      body: String(result)
    });
    return;
  }

  if (path === '/getAllItems' && req.method === 'GET') {
    db.query('SELECT * FROM Items', (err, results) => {
      if (err) {
        sendJson(res, 500, null);
        return;
      }
      sendJson(res, 200, results);
    });
    return;
  }

  if (path === '/addItem' && req.method === 'POST') {
    const name = urlObj.searchParams.get('name');
    const desc = urlObj.searchParams.get('desc');

    if (!name || !desc) {
      sendJson(res, 400, null);
      return;
    }

    db.query(
      'INSERT INTO Items (name, `desc`) VALUES (?, ?)',
      [name, desc],
      (err, result) => {
        if (err) {
          sendJson(res, 500, null);
          return;
        }

        const item = {
          id: result.insertId,
          name,
          desc
        };

        sendJson(res, 200, item);
      }
    );
    return;
  }

  if (path === '/deleteItem' && req.method === 'POST') {
    const id = Number(urlObj.searchParams.get('id'));

    if (!id || Number.isNaN(id)) {
      sendJson(res, 400, null);
      return;
    }

    db.query('SELECT * FROM Items WHERE id = ?', [id], (err, rows) => {
      if (err) {
        sendJson(res, 500, null);
        return;
      }

      if (rows.length === 0) {
        sendJson(res, 200, {});
        return;
      }

      const item = rows[0];

      db.query('DELETE FROM Items WHERE id = ?', [id], (delErr) => {
        if (delErr) {
          sendJson(res, 500, null);
          return;
        }

        sendJson(res, 200, item);
      });
    });
    return;
  }

  if (path === '/updateItem' && req.method === 'POST') {
    const id = Number(urlObj.searchParams.get('id'));
    const name = urlObj.searchParams.get('name');
    const desc = urlObj.searchParams.get('desc');

    if (!id || Number.isNaN(id) || !name || !desc) {
      sendJson(res, 400, null);
      return;
    }

    db.query('SELECT * FROM Items WHERE id = ?', [id], (err, rows) => {
      if (err) {
        sendJson(res, 500, null);
        return;
      }

      if (rows.length === 0) {
        sendJson(res, 200, {});
        return;
      }

      db.query(
        'UPDATE Items SET name = ?, `desc` = ? WHERE id = ?',
        [name, desc, id],
        (updateErr) => {
          if (updateErr) {
            sendJson(res, 500, null);
            return;
          }

          sendJson(res, 200, {
            id,
            name,
            desc
          });
        }
      );
    });
    return;
  }

  sendJson(res, 404, null);
});

server.listen(port, host, () => {
  console.log(`Сервер запущен: http://${host}:${port}/`);
});