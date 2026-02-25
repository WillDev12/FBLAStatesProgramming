// Thin HTTP client for communicating with the local backend server.
// Wraps Node's built-in http module and resolves with { statusCode, data }
// so callers can check both the status and parsed JSON body.

const http = require("node:https");

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : "";

    const options = {
      hostname: "fblastatesprogramming-production.up.railway.app",
      // port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

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
