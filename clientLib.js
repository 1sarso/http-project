// clientLib.js
const net = require('net');

function parseURL(url) {
    const { hostname, port, pathname } = new URL(url);
    return { hostname, port: port || 80, path: pathname };
}

function buildRequest(method, path, headers, body) {
    let request = `${method} ${path} HTTP/1.1\r\n`;
    for (const [key, value] of Object.entries(headers)) {
        request += `${key}: ${value}\r\n`;
    }
    request += `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
    return request;
}

function request(method, url, headers = {}, body = '') {
    const { hostname, port, path } = parseURL(url);
    const client = new net.Socket();
    const requestData = buildRequest(method, path, headers, body);

    return new Promise((resolve, reject) => {
        client.connect(port, hostname, () => {
            client.write(requestData);
        });

        let response = '';
        client.on('data', (data) => {
            response += data.toString();
        });

        client.on('end', () => {
            resolve(response);
            client.destroy();
        });

        client.on('error', reject);
    });
}

module.exports = { request };
