/*script to do stuff, please comment*/

class changeMeName extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.pagedMerge = [];
  }
  onDeclaration(declaration, dItem, dList, rule) {
    //experimental merge
    if (declaration.property == "--paged-merge") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replaceAll('[data-id="', "#");
      sel = sel.replaceAll('"]', "");
      let itemsList = sel.split(",");
      itemsList.forEach((elId) => {
        this.pagedMerge.push({
          into: elId,
          from: declaration.value.value.trim().split(" "),
        });
      });
    }
  }
  beforeParsed(content) {
    this.pagedMerge.forEach((merge) => {
      let mergeWrapper = document.createElement("div");
      mergeWrapper.classList.add("paged-merged-wrapper");

      content.querySelectorAll(merge.into).forEach((into) => {
        let found = document.createElement("span");
        found.classList.add("found");
        found.style.position = "absolute";

        content
          .querySelector(merge.into)
          .insertAdjacentElement("beforebegin", found);
        mergeWrapper.insertAdjacentElement(
          "beforeend",
          content.querySelector(merge.into),
        );

        content.querySelectorAll(merge.from).forEach((from) => {
          mergeWrapper.insertAdjacentElement(
            "beforeend",
            content.querySelector(merge.from),
          );
        });

        content
          .querySelector(".found")
          .insertAdjacentElement("beforebegin", mergeWrapper);

        content.querySelector(".found").remove();
      });
    });
  }
  finalizePage(page, pageMeta) {}
  afterRendered(pages) {}
}

// check for problem
Paged.registerHandlers(changeMeName);
