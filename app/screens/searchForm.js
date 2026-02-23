const blessed = require("neo-blessed");
const visualError = require("../modules/error.js");

const categories = ["None", "Sciences", "Electricity", "Anthropology"];

const validateAreaCode = (areaCode, screen) => {
  setImmediate(() => {
    const currentVal = areaCode.getValue();

    const hasInvalidChars = /[^0-9]/.test(currentVal);

    if (hasInvalidChars || currentVal.length > 5) {
      areaCode.style.border.fg = "red";
    } else {
      areaCode.style.border.fg = "white";
    }

    screen.render();
  });
};

const validateName = (name, screen) => {
  setImmediate(() => {
    const currentVal = name.getValue();

    const valid = /^[a-zA-Z ]*$/.test(currentVal);

    if (!valid) {
      name.style.border.fg = "red";
    } else {
      name.style.border.fg = "white";
    }

    screen.render();
  });
};

function form(parent, screen, listformData) {
  const searchForm = blessed.form({
    top: "center",
    left: "center",
    bottom: 0,
    width: "45%",

    keys: true,

    label: " Search ",
    border: "line",
    style: { border: { fg: "blue" } },
    padding: {
      top: 1,
      left: 2,
      right: 2,
      bottom: 1,
    },
    height: 19,

    parent: parent,
  });

  blessed.text({
    parent: searchForm,
    top: 0,
    left: 1,
    content: "Name",
  });

  const name = blessed.textbox({
    parent: searchForm,
    top: 1,
    name: "name",
    // keys: true,

    inputOnFocus: true,

    border: "line",
    height: 3,
    style: {
      focus: {
        border: {
          fg: "white",
        },
      },
    },
  });

  blessed.text({
    parent: searchForm,
    top: 4,
    left: 1,
    content: "Area code",
  });

  const areaCode = blessed.textbox({
    parent: searchForm,
    top: 5,
    name: "areaCode",

    inputOnFocus: true,

    border: "line",
    height: 3,
    width: 10,
    style: {
      focus: {
        border: {
          fg: "white",
        },
      },
    },
  });

  blessed.text({
    parent: searchForm,
    top: 8,
    left: 1,
    content: "Stars",
  });

  const stars = blessed.textbox({
    parent: searchForm,
    top: 9,
    name: "stars",

    inputOnFocus: true,

    border: "line",
    height: 3,
    width: 10,
    style: {
      focus: {
        border: {
          fg: "white",
        },
      },
    },
  });

  blessed.text({
    parent: searchForm,
    top: 12,
    left: 1,
    content:
      "Stars can be expressed in a range -- eg. '5-4'\nDecimals permitted.",
    style: {
      fg: "gray",
    },
  });

  blessed.text({
    parent: searchForm,
    top: 4,
    left: 13,
    content: "Category",
  });

  const category = blessed.list({
    parent: searchForm,
    top: 5,
    right: 0,
    left: 12,
    name: "category",

    keys: true,
    vi: true,

    border: "line",
    items: [],
    style: { selected: { bg: "blue" }, focus: { border: { fg: 350 } } },
    height: 7,

    scrollbar: {
      ch: " ",
      track: { bg: 235 },
      style: {
        inverse: true,
        bg: 244,
      },
    },
  });

  const createBtn = blessed.button({
    parent: searchForm,
    top: 14,
    right: 0,
    height: 1,
    width: "shrink",

    content: " List Business ",

    style: {
      bg: "blue",
      focus: {
        bg: "red",
      },
    },
  });

  createBtn.on("press", () => {
    showListForm(parent, screen, listformData);
  });

  const validateStars = () => {
    setImmediate(() => {
      const val = stars.getValue();
      if (val === "") {
        stars.style.border.fg = "white";
        return parent.render();
      }

      // BREAKDOWN:
      // ^                   : Start of string
      // (?:\d(?:\.\d)?)     : Match a digit (0-9) optionally followed by .digit
      // (?:-(?:\d(?:\.\d)?))?: Optionally match a hyphen followed by another digit/decimal
      // $                   : End of string
      const validPattern =
        /^(?:[0-4](?:\.\d)?|5(?:\.0)?)(?:-(?:[0-4](?:\.\d)?|5(?:\.0)?))?$/;

      // Use numeric validation alongside regex for strict 0-5 enforcement
      const isWithinRange = val.split("-").every((num) => {
        const n = parseFloat(num);
        return !isNaN(n) && n >= 0 && n <= 5;
      });

      if (validPattern.test(val) && isWithinRange) {
        stars.style.border.fg = "white";
      } else {
        stars.style.border.fg = "red";
      }
      screen.render();
    });
  };

  areaCode.on("keypress", () => {
    validateAreaCode(areaCode, screen);
  });
  name.on("keypress", () => {
    validateName(name, screen);
  });
  stars.on("keypress", validateStars);

  category.setItems(categories);

  const items = [name, areaCode, stars, category];

  items.forEach((n) => {
    n.on("submit", () => {
      searchForm.submit();
    });

    if (n.type === "list") {
      n.on("select", () => {
        searchForm.submit();
      });
    }
  });

  category.on("element keypress", (el, ch, key) => {
    if (key.name === "up" || key.name === "down") {
      return false;
    }
  });

  return { searchForm, name };
}

function showListForm(parent, screen, listformData) {
  parent.emit("clear");

  const { commands, menu } = listformData;

  commands.Back = { keys: ["esc"] };
  commands.Submit = { keys: ["ctrl+s"] };
  menu.setItems(commands);

  const listForm = blessed.form({
    top: "center",
    left: "center",
    bottom: 0,
    width: "45%",

    keys: true,

    label: " List Business ",
    border: "line",
    style: { border: { fg: "blue" } },
    padding: {
      top: 1,
      left: 2,
      right: 2,
      bottom: 1,
    },
    height: 20,

    parent: parent,
  });

  blessed.text({
    parent: listForm,
    top: 0,
    left: 1,
    content: "Name",
  });

  const name = blessed.textbox({
    parent: listForm,
    top: 1,
    name: "name",
    // keys: true,

    inputOnFocus: true,

    border: "line",
    height: 3,
    style: {
      focus: {
        border: {
          fg: "white",
        },
      },
    },
  });

  blessed.text({
    parent: listForm,
    top: 4,
    left: 1,
    content: "Area code",
  });

  const areaCode = blessed.textbox({
    parent: listForm,
    top: 5,
    name: "areaCode",

    inputOnFocus: true,

    border: "line",
    height: 3,
    width: 10,
    style: {
      focus: {
        border: {
          fg: "white",
        },
      },
    },
  });

  // blessed.text({
  //   parent: listForm,
  //   top: 12,
  //   left: 1,
  //   content:
  //     "Stars can be expressed in a range -- eg. '5-4'\nDecimals permitted.",
  //   style: {
  //     fg: "gray",
  //   },
  // });

  blessed.text({
    parent: listForm,
    top: 4,
    left: 13,
    content: "Category",
  });

  const category = blessed.list({
    parent: listForm,
    top: 5,
    right: 0,
    left: 12,
    name: "category",

    keys: true,
    vi: true,

    border: "line",
    items: [],
    style: { selected: { bg: "blue" }, focus: { border: { fg: 350 } } },
    height: 6,

    scrollbar: {
      ch: " ",
      track: { bg: 235 },
      style: {
        inverse: true,
        bg: 244,
      },
    },
  });

  blessed.text({
    parent: listForm,
    top: 11,
    left: 1,
    content: "Description",
  });

  const description = blessed.textarea({
    parent: listForm,
    top: 12,
    name: "stars",

    keys: true,

    inputOnFocus: true,
    scrollable: true,
    alwaysScroll: true,

    border: "line",
    height: 4,
    // width: 10,
    style: {
      focus: {
        border: {
          fg: "white",
        },
      },
    },

    scrollbar: {
      ch: " ",
      track: { bg: 235 },
      style: {
        inverse: true,
        bg: 244,
      },
    },
  });

  let theseItems = categories.filter((item) => item !== "None");
  category.setItems(theseItems);

  [category, description].forEach((el) => {
    el.on("element keypress", (node, ch, key) => {
      if (key.name === "up" || key.name === "down") {
        if (el === description) {
          // Scroll the element
          el.scroll(key.name === "up" ? -1 : 1);

          // IMPORTANT: You must render the screen to see the change
          screen.render();

          // Return false to stop the "form" from switching focus to the next input
        }
        return false;
      }
    });
  });

  function handleNavigation(el, ch, key) {
    if (key.full === "escape") {
      parent.emit("clear");

      delete commands.Back;
      commands.Submit.keys = ["enter"];
      menu.setItems(commands);

      require("../api/search.js")(parent, screen, commands, menu);
    }

    if (key.ctrl && key.name === "s") {
      listForm.submit();
    }
  }

  listForm.on("submit", (data) => {
    if (
      name.style.border === "red" ||
      areaCode.style.border === "red" ||
      name.getValue() === "" ||
      areaCode.getValue() === "" ||
      description.getValue() === ""
    ) {
      name.cancel();

      // 2. Clear the screen's focus pointer
      screen.focused = null;

      // 3. Re-render to ensure the cursor moves away from the textbox
      screen.render();

      visualError(
        "One or more of your answers are invalid.  Please try again.",
        parent,
        name
      );
    } else {
      parent.emit("creation", data);
    }
  });

  [name, areaCode, category].forEach((el) => {
    el.on("keypress", (ch, key) => {
      if (key.name === "enter") {
        name.focus();
      }
    });
  });

  // CORRECT: Pass the function name, do not call it with ()
  listForm.on("element keypress", handleNavigation);
  areaCode.on("keypress", () => {
    validateAreaCode(areaCode, screen);
  });
  name.on("keypress", () => {
    validateName(name, screen);
  });

  name.focus();
  screen.render();
}

module.exports = form;
