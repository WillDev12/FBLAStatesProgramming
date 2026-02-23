const blessed = require("neo-blessed");
const visualError = require("./error");

function createForm(parent, text, login) {
  /* Form */
  const form = blessed.form({
    parent: parent,
    width: 50,
    height: 10,
    top: "center",
    left: "center",
    keys: true,
    vi: true,
    border: "line",
    label: ` ${text} `,
    style: { border: { fg: "blue" } },
  });

  // Username Input
  blessed.text({ parent: form, top: 2, left: 2, content: "Username:" });
  const username = blessed.textbox({
    parent: form,
    name: "user",
    top: 2,
    left: 12,
    width: 30,
    height: 1,
    inputOnFocus: true,
    // style: { focus: { bg: "blue" } },
  });

  // Password Input
  blessed.text({ parent: form, top: 4, left: 2, content: "Password:" });
  const password = blessed.textbox({
    parent: form,
    name: "pass",
    censor: true,
    top: 4,
    left: 12,
    width: 30,
    height: 1,
    inputOnFocus: true,
    // style: { focus: { bg: "blue" } },
  });

  // Login Button
  const submitBtn = blessed.button({
    parent: form,
    name: "submit",
    content: ` ${text.toUpperCase()} `,
    top: 6,
    // When login is true, push to the left; otherwise, center it
    left: login ? "25%" : "center",
    shrink: true,
    padding: { left: 1, right: 1 },
    style: {
      bg: "blue",
      focus: { bg: "red" },
      hover: { bg: "red" },
    },
  });

  /* Underneath */

  // const verificationText = blessed.text({
  //   parent: parent, // Attach to the same parent as the form
  //   content: "Verification:\nhttps://localsearch.vercel.app/v/1998285",
  //   left: "center", // Horizontally centers the text
  //   top: "50%+5", // 50% (vertical center) + 5 (half of form height 10)
  //   style: { fg: "gray" },
  // });

  // verificationText.hide();

  submitBtn.on("press", () => {
    if (username.value.trim().length > 0 && password.value.trim().length > 0)
      form.submit();
    else visualError("You need to fill in every value.", parent, submitBtn);
  });

  username.focus();

  if (login) {
    const signupBtn = blessed.button({
      parent: form,
      name: "signup",
      content: " SIGN UP ",
      top: 6, // Same line as submitBtn
      left: "50%", // Positioned to the right of the first button
      shrink: true,
      padding: { left: 1, right: 1 },
      style: {
        bg: "blue",
        focus: { bg: "red" },
        hover: { bg: "red" },
      },
    });

    signupBtn.on("press", () => form.emit("signup_transition"));
  }

  return { form, submitBtn };
}

module.exports = { createForm };
