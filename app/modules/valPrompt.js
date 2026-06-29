const blessed = require("neo-blessed");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

function spawnWrite(cmd, args, text) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    proc.stdin.write(text);
    proc.stdin.end();
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    proc.on("error", reject);
  });
}

async function writeToClipboard(text) {
  if (process.platform === "darwin") return spawnWrite("pbcopy", [], text);
  if (process.platform === "win32") return spawnWrite("clip", [], text);

  // Try system tools first
  for (const [cmd, args] of [
    ["xclip", ["-selection", "clipboard"]],
    ["xsel", ["--clipboard", "--input"]],
  ]) {
    try { await spawnWrite(cmd, args, text); return; } catch (_) {}
  }

  // Extract clipboardy's bundled xsel to /tmp and run it from there
  const bundledXsel = path.join(path.dirname(require.resolve("clipboardy")), "fallbacks/linux/xsel");
  const tmpXsel = path.join(os.tmpdir(), "localsearch-xsel");
  if (!fs.existsSync(tmpXsel)) {
    fs.writeFileSync(tmpXsel, fs.readFileSync(bundledXsel));
    fs.chmodSync(tmpXsel, 0o755);
  }
  await spawnWrite(tmpXsel, ["--clipboard", "--input"], text);
}

const domain = process.env.testing ? "localhost:3000" : process.env.serverURL;

function valPrompt(code, parent, type) {
  const url = `${domain}/user/${type}/verify/${code}`;

  const box = blessed.box({
    width: 70,
    height: "shrink",
    top: "center",
    left: "center",
    label: " Verification ",
    border: "line",
    style: { border: { fg: "blue" } },
    parent: parent,
    padding: 1,
  });

  blessed.text({
    parent: box,
    top: 0,
    left: 2,
    width: 50,
    content: `Please open the following url in a web browser:\n${url}\n\nAnd click the button`,
  });

  const exitBtn = blessed.button({
    parent: box,
    top: 0,
    right: 2,
    shrink: true,
    content: " Verify ",
    padding: { left: 1, right: 1 },
    style: { bg: "blue", focus: { bg: "red" }, hover: { bg: "red" } },
  });

  const copyBtn = blessed.button({
    parent: box,
    top: 2,
    right: 2,
    shrink: true,
    content: " Copy URL ",
    padding: { left: 1, right: 1 },
    keys: true,
    mouse: true,
    style: { bg: "blue", focus: { bg: "red" }, hover: { bg: "red" } },
  });

  exitBtn.focus();

  let verifying = false;

  exitBtn.on("press", () => {
    if (verifying) return;
    verifying = true;
    exitBtn.setContent(" Please wait... ");
    box.screen.render();
    box.emit("login_attempt", code);
  });

  box.on("verify_failed", () => {
    verifying = false;
    exitBtn.setContent(" Verify ");
    box.screen.render();
  });

  exitBtn.key(["down"], () => copyBtn.focus());
  copyBtn.key(["up"], () => exitBtn.focus());

  async function doCopy() {
    try {
      await writeToClipboard(url);
      copyBtn.setContent(" Copied! ");
      box.screen.render();
      setTimeout(() => {
        copyBtn.setContent(" Copy URL ");
        box.screen.render();
      }, 1500);
    } catch (_) {
      copyBtn.setContent(" Failed ");
      box.screen.render();
      setTimeout(() => {
        copyBtn.setContent(" Copy URL ");
        box.screen.render();
      }, 1500);
    }
  }

  copyBtn.on("press", doCopy);
  copyBtn.on("click", doCopy);

  return { box, exitBtn };
}

module.exports = valPrompt;
