const next = require('next');
const http = require('http');

const port = process.env.PORT || 4000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http.createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log('Server listening on', port);
  });
});