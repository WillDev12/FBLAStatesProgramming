const http = require("node:http"); // Change from 'https' to 'http'

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : "";

    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      // No 'agent' with rejectUnauthorized needed for plain http
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    // Use http.request instead of https.request
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
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
