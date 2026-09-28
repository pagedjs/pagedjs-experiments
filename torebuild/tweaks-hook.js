// interpret custom property on tweaks and add the corresponding class

class CSStoClass extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.floatSameTop = [];
    this.floatSameBottom = [];
    this.floatNextTop = [];
    this.floatNextBottom = [];
    this.experimentalImageEdit = [];
    this.spacing = [];
    this.pushblock = [];
    this.experimentalMerged = [];
    this.fullPageBackground = [];
  }
  onDeclaration(declaration, dItem, dList, rule) {
    // alter the image
    if (declaration.property == "--experimental-image-edit") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");
      let itemsList = sel.split(",");
      itemsList.forEach((elId) => {
        this.experimentalImageEdit.push(elId);
      });
    }
    // move the element to the next bit
    else if (declaration.property == "--experimental-push") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");
      let itemsList = sel.split(",");
      itemsList.forEach((elId) => {
        this.pushblock.push([elId, declaration.value.value]);
      });
    } else if (declaration.property == "--experimental-fullpage") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");
      let itemsList = sel.split(",");
      itemsList.forEach((elId) => {
        this.fullPageBackground.push([elId, declaration.value.value]);
      });
    }
    //experimental merge
    else if (declaration.property == "--experimental-merge") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");
      let itemsList = sel.split(",");
      itemsList.forEach((elId) => {
        this.experimentalMerged.push([elId, declaration.value.value]);
      });
    }
    // page floats
    else if (declaration.property == "--experimental-page-float") {
      if (declaration.value.value.includes("same-top")) {
        let sel = csstree.generate(rule.ruleNode.prelude);
        sel = sel.replace('[data-id="', "#");
        sel = sel.replace('"]', "");
        this.floatSameTop.push(sel.split(","));
        //console.log("floatSameTop: ", this.floatSameTop);
      } else if (declaration.value.value.includes("same-bottom")) {
        let sel = csstree.generate(rule.ruleNode.prelude);
        sel = sel.replace('[data-id="', "#");
        sel = sel.replace('"]', "");
        this.floatSameBottom.push(sel.split(","));
        //console.log("floatSameBottom: ", this.floatSameBottom);
      } else if (declaration.value.value.includes("next-top")) {
        let sel = csstree.generate(rule.ruleNode.prelude);
        sel = sel.replace('[data-id="', "#");
        sel = sel.replace('"]', "");
        this.floatNextTop.push(sel.split(","));
        //console.log('floatNextTop: ', this.floatNextTop);
      } else if (declaration.value.value.includes("next-bottom")) {
        let sel = csstree.generate(rule.ruleNode.prelude);
        sel = sel.replace('[data-id="', "#");
        sel = sel.replace('"]', "");
        this.floatNextBottom.push(sel.split(","));
        //console.log("floatNextBottom: ", this.floatNextBottom);
      }
    }
    // spacing
    else if (declaration.property == "--experimental-spacing") {
      var spacingValue = declaration.value.value;
      spacingValue = spacingValue.replace(/\s/g, "");
      spacingValue = parseInt(spacingValue);
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");
      var thisSpacing = [sel.split(","), spacingValue];
      this.spacing.push(thisSpacing);
    }
  }

  afterParsed(parsed) {
    if (this.pushblock.length > 0) {
      this.pushblock.forEach((elToPush) => {
        const elem = parsed.querySelector(elToPush[0]);
        if (!elem) {
          return;
        }

        elem.dataset.pushBlock = elToPush[1];
        let direction = "";
        if (elToPush[1] < 0) {
          direction = "back";
        }
        if (direction == "back") {
          for (let index = 0; index < Math.abs(elToPush[1]); index++) {
            if (elem.previousElementSibling) {
              elem.previousElementSibling.insertAdjacentElement(
                "beforebegin",
                elem,
              );
            }
          }
        } else {
          for (let index = 0; index < Math.abs(elToPush[1]); index++) {
            if (elem.nextElementSibling) {
              elem.nextElementSibling.insertAdjacentElement("afterend", elem);
            }
          }
        }
      });
    }
    if (this.experimentalMerged.length > 0) {
      this.experimentalMerged.forEach((couple) => {
        const host = parsed.querySelector(couple[0]);
        const guest = parsed.querySelector(couple[1]);
        if (!host || !guest) {
          return;
        }
        guest.style.display = "none";
        host.classList.add("merged!");
        host.dataset.mergedGuest = guest.id;
        host.insertAdjacentHTML("beforeend", guest.innerHTML);
      });
    }
    if (this.experimentalImageEdit.length > 0) {
      this.experimentalImageEdit.forEach((elNBlist) => {
        parsed.querySelectorAll(elNBlist).forEach((img) => {
          img.classList.add("imageMover");

          // console.log("#" + img.id + ": image Mover");
        });
      });
    }
    if (this.floatNextBottom) {
      this.floatNextBottom.forEach((elNBlist) => {
        parsed.querySelectorAll(elNBlist).forEach((el) => {
          el.classList.add("page-float-next-bottom");
          // console.log("#" + el.id + " moved to next-bottom");
        });
      });
    }
    if (this.floatNextTop) {
      this.floatNextTop.forEach((elNBlist) => {
        parsed.querySelectorAll(elNBlist).forEach((el) => {
          el.classList.add("page-float-next-top");
          // console.log("#" + el.id + " moved to next-top");
        });
      });
    }
    if (this.floatSameTop) {
      this.floatSameTop.forEach((elNBlist) => {
        parsed.querySelectorAll(elNBlist).forEach((el) => {
          el.classList.add("page-float-same-top");
          // console.log("#" + el.id + " moved to same-top");
        });
      });
    }
    if (this.floatSameBottom) {
      this.floatSameBottom.forEach((elNBlist) => {
        parsed.querySelectorAll(elNBlist).forEach((el) => {
          el.classList.add("page-float-same-bottom");
          // console.log("#" + el.id + " moved to same-bottom");
        });
      });
    }
    if (this.spacing) {
      this.spacing.forEach((elNBlist) => {
        parsed.querySelectorAll(elNBlist[0]).forEach((el) => {
          var spacingValue = elNBlist[1];
          var spacingClass = "spacing-" + spacingValue;
          // console.log(spacingClass);
          el.classList.add(spacingClass);
          // console.log("#" + el.id + " spaced " + spacingValue);
        });
      });
    }
    if (this.fullPageBackground) {
      this.fullPageBackground.forEach((background) => {
        parsed.querySelectorAll(background[0]).forEach((el) => {
          el.classList.add("moveToBackgroundImage");
        });
      });
    }
  }
}

Paged.registerHandlers(CSStoClass);
