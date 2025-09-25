/**
 * A custom Paged.js handler that processes `--paged-move` CSS custom properties
 * to reorder elements in the DOM before layout rendering.
 *
 * This handler scans for declarations like `--paged-move: N` and moves the matching
 * elements N steps forward or backward in the DOM tree during the `beforeParsed` phase.
 *
 * @extends Paged.Handler
 *
 * credits: julientaq
 */
class pushThings extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.pushblock = [];
  }
  onDeclaration(declaration, dItem, dList, rule) {
    // move the element to the next bit
    if (declaration.property == "--paged-move") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");
      let itemsList = sel.split(",");
      itemsList.forEach((elId) => {
        this.pushblock.push([elId, declaration.value.value.trim()]);
      });
    }
  }

  beforeParsed(parsed) {
    console.log(this.pushblock);
    if (this.pushblock.length > 0) {
      this.pushblock.forEach((elToPush) => {
        const elem = parsed.querySelector(elToPush[0]);
        if (!elem) {
          console.log("no elem to push!");
          return;
        }
        let move = Number(elToPush[1]);
        elem.classList.add(`push-${move}`);
        let order = "";
        if (elToPush[1].trim() < 0) {
          order = "back";
        }
        if (order == "back") {
          for (let index = 0; move < index; move++) {
            if (elem.previousElementSibling) {
              elem.previousElementSibling.insertAdjacentElement(
                "beforebegin",
                elem,
              );
            }
          }
        } else {
          for (let index = 0; move > index; move--) {
            if (elem.nextElementSibling) {
              elem.nextElementSibling.insertAdjacentElement("afterend", elem);
            }
          }
        }
      });
    }
  }
}

Paged.registerHandlers(pushThings);
