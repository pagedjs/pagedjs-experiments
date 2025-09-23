// warning, offset top is added/ merged after the element is added, so things will move after the baseline offset is set in case of merged margin
//

class baseline extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.baselineValue;
  }

  onDeclaration(declaration, dItem, dList, rule) {
    if (declaration.property == "--pagedjs-baseline") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");
      this.baselineValue = declaration.value.value
        ? parseInt(declaration.value.value)
        : 16;
    }
  }

  renderNode(node, sourceNode) {
    console.log(node);
    if (node.nodeType == 1) {
      if (node.tagName == "FIGCAPTION") {
        node.style.color = "purple";
        startBaseline(node, this.baselineValue);
      }
      if (node.previousElementSibling?.tagName != "P") {
        node.classList.add("pushThis");
        // const el = node.element;
        startBaseline(node, this.baselineValue);
      }
    }
  }
}

Paged.registerHandlers(baseline);

function startBaseline(element, baseline) {
  console.log(element);
  // snap element after specific element on the baseline grid.
  if (element) {
    const elementOffset = element.offsetTop;

    const elementline = Math.floor(elementOffset / baseline);

    console.log(element);
    console.log("line", elementline);

    if (elementline != baseline) {
      const nextPline = (elementline + 1) * baseline;

      if (!(nextPline - elementOffset == baseline)) {
        element.classList.add("pushed-to-baseline");
        element.style.paddingTop = `${nextPline - elementOffset}px`;
      }
    }
  }
}
