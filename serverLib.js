const net = require('net');

const routes = {};
const API_KEY = '12345';  // Sets the API key

function on(method, path, handler) {
    routes[`${method}:${path}`] = handler;
}

function listen(port) {
    const server = net.createServer((socket) => {
        socket.on('data', (data) => {
            const [requestLine, ...headerLines] = data.toString().split('\r\n');
            const [method, path] = requestLine.split(' ');

            const headers = {};
            let body = '';
            let isBody = false;

            for (const line of headerLines) {
                if (line === '') {
                    isBody = true;
                    continue;
                }
                if (isBody) {
                    body += line;
                } else {
                    const [key, value] = line.split(': ');
                    headers[key] = value;
                }
            }

            if (headers['API-Key'] !== API_KEY) {
                socket.write('HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\n\r\n');
                socket.end();
                return;
            }

            const handler = routes[`${method}:${path}`];
            if (handler) {
                handler({ method, path, headers, body }, {
                    send: (status, body) => {
                        socket.write(`HTTP/1.1 ${status}\r\nContent-Length: ${body.length}\r\n\r\n${body}`);
                        socket.end();
                    }
                });
            } else {
                socket.write('HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n');
                socket.end();
            }
        });
    });

    server.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}

module.exports = { on, listen };
