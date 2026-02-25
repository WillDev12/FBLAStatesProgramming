const api = require("./requestAPI.js");
async function requestData(uuid, screen) {
  try {
    const response = await api.post("/data", { auth: uuid });
    const data = response.data || {};

    if (response.statusCode >= 400 || data.error) {
      const message = typeof data === "string" ? data : data.error;
      dataError(screen, message || "Login failed");
      return;
    }

    return data;
  } catch (e) {
    dataError(screen, "Internal server error.");
  }
}

function dataError(screen, message) {
  screen.destroy();
  console.error(message);
}

module.exports = requestData;
