const fs = require("node:fs");
const path = require("path");

const filePaths = [
    path.join(__dirname, '../', 'data', 'content.json'),
    path.join(__dirname, '../', 'data', 'userData.json'),
];

filePaths.forEach(thisPath => {
    fs.writeFileSync(thisPath, "{}");
});

console.log("Database cleaned!");