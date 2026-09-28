class cuttable extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  beforeParsed(content) {
    let fakepage = document.createElement("div");
    fakepage.style.width = `calc(var(--pagedjs-width) - var(--pagedjs-margin-left) - var(--pagedjs-margin-right)`;
    document.body.insertAdjacentElement("afterbegin", fakepage);

    content.querySelectorAll("table").forEach((table) => {
      let newTable = table.cloneNode(true);
      fakepage.insertAdjacentElement("afterbegin", newTable);
      console.log(fakepage.offsetWidth, newTable.offsetWidth);

      let ok = getOverflowColumnsKeepFirstSingleArray(newTable, fakepage);
      console.log(ok);

      // let col = getColumnsOverflowingParent(newTable, fakepage);
      // console.log(col);

      let tables = splitTableByColumnGroups(newTable, [8, 6, 5]);
      tables.forEach((newtable) => {
        newtable.classList.add("subtable");
        table.insertAdjacentElement("beforebegin", newtable);
      });

      table.remove();
    });
  }
}

Paged.registerHandlers(cuttable);

function getColumnsOverflowingParent(table, parent) {
  const overflowingColumns = [];
  const parentRect = parent.getBoundingClientRect();
  const rows = table.rows;

  if (!rows.length) return overflowingColumns;

  const columnCount = rows[0].cells.length;

  for (let colIndex = 0; colIndex < columnCount; colIndex++) {
    let isOverflowing = false;

    for (let row of rows) {
      const cell = row.cells[colIndex];
      if (!cell) continue;

      const cellRect = cell.getBoundingClientRect();

      // Check if cell extends beyond parent's right boundary
      if (cellRect.right > parentRect.right) {
        isOverflowing = true;
        break;
      }
    }

    if (isOverflowing) {
      overflowingColumns.push(colIndex);
    }
  }

  return overflowingColumns;
}

function splitTableByColumnGroups(table, columnsPerGroup) {
  if (!table) return [];

  const resultTables = [];

  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  // Get total number of columns from first header row
  const firstHeaderRow = table.querySelector("thead tr, tbody tr");
  if (!firstHeaderRow) return [];

  const totalColumns = firstHeaderRow.children.length;

  let currentStart = 1; // start after first column (which will be repeated)

  columnsPerGroup.forEach((groupSize) => {
    if (currentStart >= totalColumns) return;

    const end = Math.min(currentStart + groupSize, totalColumns);

    const newTable = document.createElement("table");
    copyAttributes(table, newTable);

    // ===== THEAD =====
    if (thead) {
      const newThead = document.createElement("thead");

      thead.querySelectorAll("tr").forEach((tr) => {
        const newRow = document.createElement("tr");
        const cells = Array.from(tr.children);

        // Always clone first column
        if (cells[0]) {
          newRow.appendChild(cells[0].cloneNode(true));
        }

        // Clone group columns
        cells.slice(currentStart, end).forEach((cell) => {
          newRow.appendChild(cell.cloneNode(true));
        });

        newThead.appendChild(newRow);
      });

      newTable.appendChild(newThead);
    }

    // ===== TBODY =====
    if (tbody) {
      const newTbody = document.createElement("tbody");

      tbody.querySelectorAll("tr").forEach((tr) => {
        const newRow = document.createElement("tr");
        const cells = Array.from(tr.children);

        if (cells[0]) {
          newRow.appendChild(cells[0].cloneNode(true));
        }

        cells.slice(currentStart, end).forEach((cell) => {
          newRow.appendChild(cell.cloneNode(true));
        });

        newTbody.appendChild(newRow);
      });

      newTable.appendChild(newTbody);
    }

    resultTables.push(newTable);
    currentStart = end;
  });

  return resultTables;
}

// Helper to copy table attributes (class, id, etc.)
function copyAttributes(source, target) {
  Array.from(source.attributes).forEach((attr) => {
    target.setAttribute(attr.name, attr.value);
  });
}

function collectOverflowColumns(table, parent) {
  const removedColumns = [];
  const originalIndexes = Array.from(
    { length: table.rows[0]?.cells.length || 0 },
    (_, i) => i,
  );

  while (true) {
    const overflowing = getColumnsOverflowingParent(table, parent);

    if (!overflowing.length) break;

    // Take the first overflowing column
    const colIndex = overflowing[0];

    // Never remove first column (index 0)
    if (colIndex === 0) break;

    // Store original index before removing
    removedColumns.push(originalIndexes[colIndex]);

    // Remove column from all rows
    for (let row of table.rows) {
      if (row.cells[colIndex]) {
        row.deleteCell(colIndex);
      }
    }

    // Remove index from tracking array
    originalIndexes.splice(colIndex, 1);
  }

  return removedColumns;
}

class RepeatTableHeadersHandler extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.splitTablesRefs = [];
  }

  afterPageLayout(pageElement, page, breakToken, chunker) {
    this.chunker = chunker;
    this.splitTablesRefs = [];

    // Check all the tables on the current page
    const tablesOnPage = pageElement.querySelectorAll("table");

    // Check which tables have sources
    for (let table of tablesOnPage) {
      if (table.dataset.ref) {
        const sourceTable = chunker.source.querySelector(
          `[data-ref='${table.dataset.ref}']`,
        );
        if (sourceTable) {
          this.splitTablesRefs.push(table.dataset.ref);
        }
      }
    }

    if (breakToken) {
      const node = breakToken.node;
      const tables = this.findAllAncestors(node, "table");

      if (node.tagName === "TABLE") tables.push(node);

      if (tables.length > 0) {
        this.splitTablesRefs = tables.map((t) => t.dataset.ref);

        let thead =
          node.tagName === "THEAD"
            ? node
            : this.findFirstAncestor(node, "thead");
        if (thead) {
          let lastTheadNode = thead.hasChildNodes() ? thead.lastChild : thead;
          breakToken.node = this.nodeAfter(lastTheadNode, chunker.source);
        }

        this.hideEmptyTables(pageElement, node);
      }
    }
  }

  hideEmptyTables(pageElement, breakTokenNode) {
    this.splitTablesRefs.forEach((ref) => {
      let table = pageElement.querySelector("[data-ref='" + ref + "']");
      if (table) {
        let sourceBody = table.querySelector("tbody > tr");
        if (
          !sourceBody ||
          this.refEquals(sourceBody.firstElementChild, breakTokenNode)
        ) {
          table.style.visibility = "hidden";
          table.style.position = "absolute";
          let lineSpacer = table.nextSibling;
          if (lineSpacer) {
            lineSpacer.style.visibility = "hidden";
            lineSpacer.style.position = "absolute";
          }
        }
      }
    });
  }

  refEquals(a, b) {
    return a && a.dataset && b && b.dataset && a.dataset.ref === b.dataset.ref;
  }

  findFirstAncestor(element, selector) {
    while (element.parentNode && element.parentNode.nodeType === 1) {
      if (element.parentNode.matches(selector)) return element.parentNode;
      element = element.parentNode;
    }
    return null;
  }

  findAllAncestors(element, selector) {
    const ancestors = [];
    while (element.parentNode && element.parentNode.nodeType === 1) {
      if (element.parentNode.matches(selector))
        ancestors.unshift(element.parentNode);
      element = element.parentNode;
    }
    return ancestors;
  }

  layout(rendered, layout) {
    this.splitTablesRefs.forEach((ref) => {
      const renderedTable = rendered.querySelector("[data-ref='" + ref + "']");
      if (renderedTable) {
        if (!renderedTable.getAttribute("repeated-headers")) {
          const sourceTable = this.chunker.source.querySelector(
            "[data-ref='" + ref + "']",
          );
          this.repeatColgroup(sourceTable, renderedTable);
          this.repeatTHead(sourceTable, renderedTable);
          renderedTable.setAttribute("repeated-headers", true);
        }
      }
    });
  }

  repeatColgroup(sourceTable, renderedTable) {
    let colgroup = sourceTable.querySelectorAll("colgroup");
    let firstChild = renderedTable.firstChild;
    colgroup.forEach((colgroup) => {
      let clonedColgroup = colgroup.cloneNode(true);
      renderedTable.insertBefore(clonedColgroup, firstChild);
    });
  }

  repeatTHead(sourceTable, renderedTable) {
    let thead = sourceTable.querySelector("thead");
    if (thead) {
      let clonedThead = thead.cloneNode(true);
      renderedTable.insertBefore(clonedThead, renderedTable.firstChild);
    }
  }

  nodeAfter(node, limiter) {
    if (limiter && node === limiter) return;
    let significantNode = this.nextSignificantNode(node);
    if (significantNode) return significantNode;
    if (node.parentNode) {
      while ((node = node.parentNode)) {
        if (limiter && node === limiter) return;
        significantNode = this.nextSignificantNode(node);
        if (significantNode) return significantNode;
      }
    }
  }

  nextSignificantNode(sib) {
    while ((sib = sib.nextSibling)) {
      if (!this.isIgnorable(sib)) return sib;
    }
    return null;
  }

  isIgnorable(node) {
    return (
      node.nodeType === 8 || (node.nodeType === 3 && this.isAllWhitespace(node))
    );
  }

  isAllWhitespace(node) {
    return !/[^\t\n\r ]/.test(node.textContent);
  }
}

Paged.registerHandlers(RepeatTableHeadersHandler);

function getOverflowColumnsWithoutMutating(table, parent) {
  const totalColumns = table.rows[0]?.cells.length || 0;
  const originalIndexes = Array.from({ length: totalColumns }, (_, i) => i);

  let remainingIndexes = [...originalIndexes]; // columns still “visible”
  const removedColumns = [];

  while (true) {
    const overflowing = [];

    const parentRect = parent.getBoundingClientRect();

    // Check each remaining column
    for (let i = 0; i < remainingIndexes.length; i++) {
      const colIndex = remainingIndexes[i];
      let isOverflowing = false;

      for (let row of table.rows) {
        const cell = row.cells[colIndex];
        if (!cell) continue;

        const cellRect = cell.getBoundingClientRect();
        if (cellRect.right > parentRect.right) {
          isOverflowing = true;
          break;
        }
      }

      if (isOverflowing) overflowing.push(i); // store index in remainingIndexes array
    }

    if (!overflowing.length) break; // nothing more overflows

    const firstOverflowing = overflowing[0];

    if (firstOverflowing === 0) break; // never remove first column

    // Track the original index
    removedColumns.push(remainingIndexes[firstOverflowing]);

    // Remove this column from remainingIndexes (simulate removal)
    remainingIndexes.splice(firstOverflowing, 1);
  }

  return removedColumns;
}

function getOverflowColumnsRecounted(table, parent) {
  const totalColumns = table.rows[0]?.cells.length || 0;
  const originalIndexes = Array.from({ length: totalColumns }, (_, i) => i);

  let remainingIndexes = [...originalIndexes]; // columns still “visible”
  const removedColumns = [];

  while (true) {
    const overflowing = [];

    const parentRect = parent.getBoundingClientRect();

    // Check each remaining column (recounted from 0)
    for (let i = 0; i < remainingIndexes.length; i++) {
      const colIndex = remainingIndexes[i];
      let isOverflowing = false;

      for (let row of table.rows) {
        const cell = row.cells[colIndex];
        if (!cell) continue;

        const cellRect = cell.getBoundingClientRect();
        if (cellRect.right > parentRect.right) {
          isOverflowing = true;
          break;
        }
      }

      if (isOverflowing) overflowing.push(i); // index in remainingIndexes
    }

    if (!overflowing.length) break; // no more overflows

    const firstOverflowing = overflowing[0];

    if (firstOverflowing === 0) break; // never remove first column

    // Store original index
    removedColumns.push(remainingIndexes[firstOverflowing]);

    // Remove this column from remainingIndexes (simulate removal)
    remainingIndexes.splice(firstOverflowing, 1);

    // At this point, remainingIndexes is “recounted” from 0 automatically
  }

  return removedColumns;
}

function getOverflowColumnsKeepFirstSingleArray(table, parent) {
  const totalColumns = table.rows[0]?.cells.length || 0;
  if (totalColumns <= 1) return [];

  const originalIndexes = Array.from({ length: totalColumns }, (_, i) => i);
  let remainingIndexes = [...originalIndexes];
  const removedColumns = [];

  while (true) {
    const overflowing = [];
    const parentRect = parent.getBoundingClientRect();

    // Check each remaining column
    for (let i = 0; i < remainingIndexes.length; i++) {
      const colIndex = remainingIndexes[i];
      let isOverflowing = false;

      for (let row of table.rows) {
        const cell = row.cells[colIndex];
        if (!cell) continue;

        const cellRect = cell.getBoundingClientRect();
        if (cellRect.right > parentRect.right) {
          isOverflowing = true;
          break;
        }
      }

      if (isOverflowing) overflowing.push(i); // index in remainingIndexes
    }

    if (!overflowing.length) break;

    const firstOverflowing = overflowing[0];

    // Never remove the first column (original index 0)
    if (remainingIndexes[firstOverflowing] === 0) break;

    // Add to removedColumns (original index)
    removedColumns.push(remainingIndexes[firstOverflowing]);

    // Remove from remainingIndexes to simulate removal
    remainingIndexes.splice(firstOverflowing, 1);
  }

  return removedColumns;
}
