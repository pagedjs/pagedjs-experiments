//import mermaid.js
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

//run mermaid.js
class pagedjsNotes extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  //beforeParsed happens before paged.js do anything, but after the css has been read.
  async beforeParsed(content) {
    mermaid.initialize({ startOnLoad: false });

    content.querySelectorAll(".mermaid").forEach((el) => {
      drawDiagram();
    });
  }
}
Paged.registerHandlers(pagedjsNotes);

// Example of using the render function
const drawDiagram = async function (element) {
  element = document.querySelector(element);
  const graphDefinition = element.innerHTML;
  const { svg } = await mermaid.render("graphDiv", graphDefinition);
  element.innerHTML = svg;
};
