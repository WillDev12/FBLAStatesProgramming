const blessed = require("neo-blessed");

function build(parent) {
  const searchResults = blessed.box({
    top: "center",
    left: 0,
    bottom: 0,

    width: "45%",
    height: 18,
    padding: 1,
    border: "line",
    label: " Results ",
    style: { border: { fg: "blue" } },

    parent: parent,
  });

  const resultsText = blessed.text({
    parent: searchResults,
    top: 0,
    left: 2,
    tags: true,

    content: `Results: {yellow-fg}5{/}`,
  });

  // items: [
  //   `Telecom - {yellow-fg}5{/} - {gray-fg}Basic description of the content that goes about...{/gray-fg}`,
  //   `Telecom - {yellow-fg}5{/} - {gray-fg}Basic description of the content that goes about...{/gray-fg}`,
  //   `Telecom - {yellow-fg}5{/} - {gray-fg}Basic description of the content that goes about...{/gray-fg}`,
  //   `Telecom - {yellow-fg}5{/} - {gray-fg}Basic description of the content that goes about...{/gray-fg}`,
  // ],

  const list = blessed.list({
    parent: searchResults,
    top: 1,
    right: 1,
    left: 1,

    keys: true,
    vi: true,
    tags: true,

    border: "line",
    style: { selected: { bg: "blue" }, focus: { border: { fg: 350 } } },
    height: 11,
    invertSelected: false,

    items: [],

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
    parent: searchResults,
    top: 12,
    left: 1,
    tags: true,
    content: `{gray-fg}Navigate with UP or DOWN arrows.\nPress ENTER to view a business.{/}`,
  });

  return { searchResults, resultsText, list };
}

module.exports = build;
