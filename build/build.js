const path = require("path");
const fs = require("node:fs");

const dotenv = require("dotenv");
const pkg = require("pkg");

const compiledPath = path.join(__dirname, 'bundle.js');

console.log("===== BUILDING PROGRAM ======================================");

const envVars = dotenv.parse(fs.readFileSync(path.join(__dirname, "../", ".env")));
const envInject = Object.entries(envVars)
    .map(([k, v]) => `process.env[${JSON.stringify(k)}] = ${JSON.stringify(v)};`)
    .join("\n");

const wrapper = `/* Compiled code for building executables */\n\n` + envInject + `\n\nrequire("../app/app.js");`;
fs.writeFileSync(compiledPath, wrapper);

pkg.exec([
    compiledPath,
    '--config', path.join(__dirname, '..', 'package.json'),
    '--targets', 'node18-linux-x64,node18-macos-x64,node18-win-x64',
    '--output', path.join(__dirname, 'dist', 'localsearch')
]).then(() => {
    console.log("===== FINISHED ==============================================");
    console.log("./build/\n  bundle.js\n  dist/\n    localsearch-linux\n    localsearch-macos\n    localsearch-win.exe");
});
