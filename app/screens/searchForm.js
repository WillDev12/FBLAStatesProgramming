// Renders the search form and the "List Business" form.
//
// The search form lets users filter businesses by name, area code, star rating,
// and category. Submitting it triggers the filtering logic in search.js.
//
// The List Business form (shown when the "List Business" button is pressed)
// collects the details needed to register a new business listing.

const blessed = require("neo-blessed");
const visualError = require("../modules/error.js");

const categories = [
  "None",
  "Technology",
  "Science",
  "Business",
  "E-Commerce",
  "Healthcare",
  "Electricity",
];

// Validates the area code field: must be numeric and at most 5 digits
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

// Validates the name field: letters and spaces only
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

// Builds and returns the search form with all its input fields and validation
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

  // Button that switches to the List Business form
  const createBtn = blessed.button({
    parent: searchForm,
    top: 14,
    right: 0,
    height: 1,
    width: "shrink",

    keys: true,

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

  // Validates the stars field against a regex that allows values 0–5 with
  // optional decimals and an optional hyphen-separated range
  const validateStars = () => {
    setImmediate(() => {
      const val = stars.getValue();
      if (val === "") {
        stars.style.border.fg = "white";
        return parent.render();
      }

      const validPattern =
        /^(?:[0-4](?:\.\d)?|5(?:\.0)?)(?:-(?:[0-4](?:\.\d)?|5(?:\.0)?))?$/;

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

  // Attach live validation to each relevant input
  areaCode.on("keypress", () => {
    validateAreaCode(areaCode, screen);
  });
  name.on("keypress", () => {
    validateName(name, screen);
  });
  stars.on("keypress", validateStars);

  category.setItems(categories);

  // Pressing Enter on any field or selecting a category item submits the form
  const items = [name, areaCode, stars, category, createBtn];

  items.forEach((n) => {
    n.once("submit", () => {
      searchForm.submit();
    });
    if (n.type === "list") {
      n.on("select", () => {
        searchForm.submit();
      });
    }
  });

  // Prevent Up/Down arrow presses inside the category list from bubbling to
  // the form and accidentally switching focus
  category.on("element keypress", (el, ch, key) => {
    if (key.name === "up" || key.name === "down") {
      return false;
    }
  });

  return { searchForm, name };
}

// Renders the "List Business" form that collects details for a new listing
function showListForm(parent, screen, listformData) {
  parent.emit("clear");

  const { commands, menu } = listformData;

  // Update the menu bar to reflect the new keyboard shortcuts
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

  // "None" is not a valid category when creating a listing
  let theseItems = categories.filter((item) => item !== "None");
  category.setItems(theseItems);

  // Prevent Up/Down from changing form focus inside the category list or
  // description textarea; instead scroll the textarea
  [category, description].forEach((el) => {
    el.on("element keypress", (node, ch, key) => {
      if (key.name === "up" || key.name === "down") {
        if (el === description) {
          el.scroll(key.name === "up" ? -1 : 1);
          screen.render();
        }
        return false;
      }
    });
  });

  // Handles Escape (cancel) and Ctrl+S (submit) for the list form
  function handleNavigation(el, ch, key) {
    if (key.full === "escape") {
      listForm.removeListener("element keypress", handleNavigation);

      // Cancel any active text input to release the keyboard grab
      [name, areaCode, description].forEach((el) => {
        if (el._reading) el.cancel();
      });

      listForm.destroy();

      delete commands.Back;
      commands.Submit.keys = ["enter"];
      menu.setItems(commands);

      // Return to the search screen
      setImmediate(() => {
        require("../api/search.js")(parent, screen, commands, menu);
      });
    }

    if (key.ctrl && key.name === "s") {
      listForm.submit();
    }
  }

  // On submission, validate that all required fields are filled and valid
  listForm.on("submit", (data) => {
    if (
      name.style.border === "red" ||
      areaCode.style.border === "red" ||
      name.getValue() === "" ||
      areaCode.getValue() === "" ||
      description.getValue() === ""
    ) {
      // Release the name input and clear focus so the error box can take over
      name.cancel();
      screen.focused = null;
      screen.render();

      visualError(
        "One or more of your answers are invalid.  Please try again.",
        parent,
        name,
      );
    } else {
      listForm.removeListener("element keypress", handleNavigation);

      // Cancel active inputs before destroying the form
      [name, areaCode, description].forEach((el) => {
        if (el._reading) el.cancel();
      });

      listForm.destroy();

      delete commands.Back;
      commands.Submit.keys = ["enter"];
      menu.setItems(commands);

      // Emit "creation" so app.js can POST the new business to the server
      parent.emit("creation", data);
    }
  });

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
