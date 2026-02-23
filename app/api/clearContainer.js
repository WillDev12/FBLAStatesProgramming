function clearContainer(screen, container) {
  if (screen.focused) {
    screen.focused = null;
  }

  // Loop backwards to avoid index shifting issues during destruction
  for (let i = container.children.length - 1; i >= 0; i--) {
    container.children[i].destroy();
  }
  screen.render();
}

module.exports = clearContainer;
