const testing = process.env.testing === "true";
const _http = require("node:http");
const _https = require("node:https");
const http = testing ? _http : _https;
const host = testing ? "localhost" : process.env.serverURL;

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : "";

    const options = {
      hostname: host,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    if (testing) options.port = 3000;

    const req = http.request(options, (res) => {
      let body = "";
      // Accumulate response chunks
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          // Try to parse as JSON; fall back to raw string if parsing fails
          const response = body ? JSON.parse(body) : {};
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on("error", (err) => reject(err));
    if (data) req.write(postData);
    req.end();
  });
}

module.exports = {
  get: (path) => request("GET", path),
  post: (path, data) => request("POST", path, data),
};
