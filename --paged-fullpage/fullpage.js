/*script to do stuff, please comment*/

class fullpage extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    //this.fullpages = <div {element: element, pagetype: [fullpage,fullspread]}]
    this.fullpages = [];
  }
  onDeclaration(declaration, dItem, dList, rule) {
    // find the --paged-fullpage: page;
    if (declaration.property == "--paged-fullpage") {
      let selectors = csstree.generate(rule.ruleNode.prelude);
      selectors = selectors.replaceAll('[data-id="', "#");
      selectors = selectors.replaceAll('"]', "");
      selectors.split(",").forEach((selector) => {
        this.fullpages.push({
          element: selector.trim(),
          type: declaration.value.value.trim(),
        });
      });
    }
  }

  beforeParsed(content) {
    this.fullpages.forEach((fp) => {
      content.querySelectorAll(fp.element).forEach((el) => {
        el.classList.add(`paged-${fp.type}`);
        el.dataset.pagedFullpage = fp.type;

        // hide the element with css
        el.style.position = "absolute";
        el.style.display = "none";
        el.style.height = "0px";
        el.style.overflow = "hidden";
      });
    });
  }

  async finalizePage(page, pageMeta) {
    let elementToMove = page.querySelectorAll(
      `.paged-fullpage`,
      `.paged-fullspread`,
    );

    elementToMove.forEach(async (el) => {
      if (
        el.dataset?.pagedFullpage == "fullpage" &&
        !el.classList.contains("processed-fullpage")
      ) {
        el.classList.add("processed-fullpage");

        let newpage = this.chunker.addPage();
        newpage.element.className = page.className;
        newpage.element.classList.add("addedpage");
        newpage.element.classList.add("pagedjs_named_page");
        newpage.element.classList.add("pagedjs-fullpage_page");

        // reshow the element
        el.style.position = "absolute";
        el.style.display = "initial";
        el.style.height = "initial";
        el.style.overflow = "initial";

        newpage.area.appendChild(el);

        await this.chunker.hooks.afterPageLayout.trigger(
          newpage.element,
          newpage,
          undefined,
          this.chunker,
        );
        await this.chunker.hooks.finalizePage.trigger(
          newpage.element,
          newpage,
          undefined,
          this.chunker,
        );
        this.chunker.emit("renderedPage", newpage);
      }
    });
  }
  afterRendered(pages) {}
}

// check for problem
Paged.registerHandlers(fullpage);
