import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

console.log("yo");

//run mermaid.js
class pagedjsNotes extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);

    this.pagedMarginNotes = [];
  }

  onDeclaration(declaration, dItem, dList, rule) {}

  // TODO: make that one work
  //
  async beforeParsed(content) {
    mermaid.initialize({ startOnLoad: false });

    content.querySelectorAll(".mermaid").forEach((el) => {
      drawDiagram();
    });
  }

  async finalizePage(page) {}

  afterRendered(pages) {}
}
Paged.registerHandlers(pagedjsNotes);

// Example of using the render function
const drawDiagram = async function (element) {
  element = document.querySelector(element);
  const graphDefinition = element.innerHTML;
  const { svg } = await mermaid.render("graphDiv", graphDefinition);
  element.innerHTML = svg;
};
