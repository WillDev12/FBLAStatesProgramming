require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

// Thin HTTP client for communicating with the local backend server.
// Wraps Node's built-in http module and resolves with { statusCode, data }
// so callers can check both the status and parsed JSON body.

const testing = process.env.testing;
const http = require(testing ? "node:http" : "node:https");
const host = testing ? "localhost" : process.env.serverURL;

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : "";

    const options = {
      hostname: host,
      path: path,
      method: method,
      headers: data
        ? {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
          }
        : {},
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
  get: (path, data) => request("GET", path, data),
  post: (path, data) => request("POST", path, data),
  patch: (path, data) => request("PATCH", path, data),
  delete: (path, data) => request("DELETE", path, data),
};
