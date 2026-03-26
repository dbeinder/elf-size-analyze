// Build a tree out of table rows to easily manipulate rows as tree elements
function buildTree() {
  const tree = { elem: null, parent: null, children: [] };
  const current = {
    node: tree,
    level: 0,
    max_level: 0,
  };

  for (const elem of document.getElementsByClassName('collapsible')) {
    const level = getLevel(elem);
    if (level == undefined) continue;

    current.max_level = Math.max(current.max_level, level);

    if (level > current.level) {
      if (level != current.level + 1) throw Error('Expected level+1 - invalid rows list');
      current.level = level;
      current.node = current.node.children[current.node.children.length - 1];
      if (!current.node) throw Error('what?')
    } else if (level < current.level) {
      for (let i = 0; i < current.level - level; i++) {
        current.node = current.node.parent;
      }
      current.level = level;
    }

    const node = { element: elem, parent: current.node, children: [] };
    current.node.children.push(node);
  }

  return { tree, max_level: current.max_level };
}

function updateChildren(node, collapsed) {
  for (const child of node.children) {
    child.element.hidden = collapsed;
    if (collapsed) {
      // Hide all descendants recursively
      child.element.classList.remove('collapsed');
      updateChildren(child, true);
    } else {
      // Show direct children but keep their subtrees collapsed
      if (child.children.length > 0) {
        child.element.classList.add('collapsed');
        updateChildren(child, true);
      }
    }
  }
}

function setCollapsed(node, collapsed) {
  if (node.children.length == 0) return;
  const method = collapsed ? 'add' : 'remove';
  node.element.classList[method]('collapsed');
  updateChildren(node, collapsed);
}

function addOnClick(node) {
  // root node has no parent, nor elements
  if (node.element) {
    node.element.addEventListener('click', () => {
      setCollapsed(node, !node.element.classList.contains('collapsed'));
    })
  }

  node.children.forEach(addOnClick);
}

// Find row level from element classes
function getLevel(elem) {
  const pattern = /level-(\d+)/
  for (const cls of elem.classList) {
    const match = cls.match(pattern);
    if (match) {
      return Number(match[1]);
    }
  }
  return undefined;
}

function expandAll(node) {
  for (const child of node.children) {
    child.element.classList.remove('collapsed');
    child.element.hidden = false;
    expandAll(child);
  }
}

function collapseAtLevel(tree, level) {
  expandAll(tree);

  const collapse = (node) => {
    for (const child of node.children) {
      if (child.element && getLevel(child.element) >= level) {
        setCollapsed(child, true);
      } else {
        collapse(child);
      }
    }
  }

  collapse(tree);
}

function onLoaded() {
  const { tree, max_level } = buildTree();
  addOnClick(tree);

  let level = max_level;

  const class_change = {
    more: () => (level = Math.max(level - 1, 0)),
    less: () => (level = Math.min(level + 1, max_level)),
    all: () => (level = 0),
    none: () => (level = max_level + 1),
  };

  const buttons = document.getElementsByClassName('collapse-buttons')[0];
  for (const cls of Object.keys(class_change)) {
    const action = class_change[cls];
    for (const elem of buttons.getElementsByClassName(cls)) {
      elem.addEventListener('click', () => {
        action();
        collapseAtLevel(tree, level);
      });

    }
  }
}

document.addEventListener('DOMContentLoaded', onLoaded);
