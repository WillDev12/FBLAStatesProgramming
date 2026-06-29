const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "verification.html");

const data = fs.readFileSync(file, "utf-8");

function changeData({text, body}) {
    return data
        .replace("[RESULT_TEXT]", text)
        .replace("[RESULT_BODY]", body);
}

module.exports = changeData;