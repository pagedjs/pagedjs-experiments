// lets you manualy add classes to some pages elements
// to simulate page floats.
// works only for elements that are not across two pages

let classElemFloatSameTop = "imgToTop"; // ← class of floated elements on same page
let classElemFloatSameBottom = "imgToBottom"; // ← class of floated elements bottom on same page

let classElemFloatNextTop = "imgToTop"; // ← class of floated elements on same page
let classElemFloatNextBottom = "imgToBottom"; // ← class of floated elements bottom on same page

class floatSame extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.floats = [];
  }

  onDeclaration(declaration, dItem, dList, rule) {
    if (declaration.property == "--paged-page-float") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replaceAll('[data-id="', "#");
      sel = sel.replaceAll('"]', "");
      this.floats.push({
        elements: sel.split(","),
        floatType: declaration.value.value.trim(),
      });
    }
  }

  beforeParsed(content) {
    // for each elements,
    this.floats.forEach((float) => {
      float.elements.forEach((selector) => {
        content.querySelectorAll(selector).forEach((el) => {
          el.classList.add("paged-to-float");
          el.dataset.toFloat = float.floatType;
        });
      });
    });
  }

  renderNode(nextClone, node) {}
  layoutNode(node) {}
  afterPageLayout(page) {}

  onOverflow(func) {
    // if return false, pagedjs continues
    // console.log(func);
    if (this.floatBottom) return false;
  }

  onBreakToken(breakToken, overflow, rendered) {
    // console.log('breakToken', breakToken)
    // console.log('overflow', overflow)
    // console.log('rendered', rendered)
    // debugger
  }
  finalizePage(page, pagemeta) {
    page.querySelectorAll(".paged-to-float").forEach((tomove) => {
      switch (tomove.dataset.toFloat) {
        case "same-bottom":
          console.log("samebottom");
          page
            .querySelector(".pagedjs_page_content div")
            .insertAdjacentElement("beforeend", tomove);
          break;
        case "same-top":
          page
            .querySelector(".pagedjs_page_content div")
            .insertAdjacentElement("afterbegin", tomove);
          break;
        default:
          page
            .querySelector(".pagedjs_page_content div")
            .insertAdjacentElement("afterbegin", tomove);
          break;
      }
    });
  }
}

Paged.registerHandlers(floatSame);

async function awaitImageLoaded(image) {
  return new Promise((resolve) => {
    if (image.complete !== true) {
      image.onload = function () {
        let { width, height } = window.getComputedStyle(image);
        resolve(width, height);
      };
      image.onerror = function (e) {
        let { width, height } = window.getComputedStyle(image);
        resolve(width, height, e);
      };
    } else {
      let { width, height } = window.getComputedStyle(image);
      resolve(width, height);
    }
  });
}
