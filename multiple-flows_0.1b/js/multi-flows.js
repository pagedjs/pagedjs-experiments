//    --------------------------------------------------------
//    MULTI FLOWS IN PAGED.JS    v 0.1b
//    Think grid on steroid (but a bit more complex than grid for now)
//
//    This script allows for multi flows in paged.js to allow multi lang and or multi things to say (ho hi *house of leaves* or anything from Danielewski).
//
//    How does it works:
//
//    - use css to define the parallel elements.
//    - find the longest bit
//    - generate the longest flow
//    - generate all the other flows, checking for element that will impact the layout `--parallel-impact`
//
//
//     CONFIGURATION
//
//     to put the content on the same spread
//     this.flowLocation = "samespread";

//     you can add one page if there are differences in page numbers between flows [only work with 2 flows]
//     this.flowSpreadAddWhite = true;

//     to put the content on the same page
//     this.flowLocation = "samepage";
//
//
//     USE WITH CSS:
//
//     The CSS is the following:
//
//     ```
//     .something {parallel-flow: alpha}
//     .something-else {parallel-flow: alpha}
//     ```
//
//      If two elements have the same flow name, they will share a page or a spread, depending on the configuration below.
//
//
//      USE WITH PARALLEL IMPACT
//
//      if an element has a `--parallel-impact: all`, the script will try to find the element on the page, and create overflown empty and transparent objects to push the content around using float and shape outside element.
//
//      WARNING: The element need to have an ID, as the overlapping clone will be called ${id}-overlap,
//
//
//     credits: code written by julien taquet (julien at lesvoisinsdustudio dot ch)
//     beta tested over the EPE workshop n march 2025
//     @ju don’t forget to add the student names who test it in there.

const htmlTemplate = (
  customPageClass,
  customPageFirst,
) => `<div id="parallel-removeme" class="pagedjs_pages">
    <div class="pagedjs_page ${customPageClass ? customPageClass : ""} ${customPageFirst ? customPageFirst : ""}">
       <div class="pagedjs_sheet">
            <div class="pagedjs_pagebox">
                <div class="pagedjs_area">
                    <div class="pagedjs_page_content">
                        <div class="testingzone"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;

class multilang extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);

    // to put the content on the same spread
    // this.flowLocation = "samespread";

    // you can add one page if there are differences in page numbers between flows [only work with 2 flows]
    // this.flowSpreadAddWhite = true;

    // to put the content on the same page
    this.flowLocation = "samepage";

    // this.parallelFlows will find the flows from the css;
    this.parallelFLows = [];

    // this.tracker will keep tack of the flows
    this.flowTracker = [];

    this.parallelImpacts = [];
  }

  onDeclaration(declaration, dItem, dList, rule) {
    if (!this.flowLocation == "samespread" || !this.flowLocation == "samepage")
      this.flowLocation = "samespread";
    if (declaration.property == "--parallel-flow") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");
      let itemsList = sel.split(",");
      itemsList.forEach((el) => {
        let flow = this.parallelFLows.find((a) => {
          return a.flow == declaration.value.value.trim();
        });
        if (flow) {
          flow.selectors.push({ selector: el, height: 0 });
        } else {
          this.parallelFLows.push({
            flow: declaration.value.value.trim(),
            selectors: [{ selector: el, height: 0 }],
          });
        }
      });
    }
    if (declaration.property == "--parallel-impact") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");
      let itemsList = sel.split(",");
      itemsList.forEach((el) => {
        this.parallelImpacts.push(el);
      });
    }
  }

  beforeParsed(content, chunker) {
    // this.parallel impacts
    this.parallelImpacts.forEach((sel) => {
      content.querySelectorAll(sel).forEach((el) => {
        el.classList.add("parallel-impact");
      });
    });

    this.parallelFLows.forEach((flow) => {
      flow.selectors = flow.selectors.filter((e) =>
        content.querySelector(e.selector),
      );
    });
    document.body.insertAdjacentHTML(
      "beforeend",
      htmlTemplate("find-if-its-a-named-page", "find-if-its-the-first-one"),
    );

    // render the parallel flows
    this.parallelFLows.forEach((flows, flowsIndex) => {
      //name of the flow
      let flowName = this.parallelFLows[flowsIndex].flow;

      // flow selectors
      flows.selectors.forEach((flow, selectorIndex) => {
        // find the longest flow.
        let theZone = document.querySelector(".testingzone");

        // check if the flow exist

        let testedFlow = content.querySelector(flow.selector).cloneNode(true);

        theZone.insertAdjacentElement("beforeend", testedFlow);

        if (selectorIndex == 0) {
          content.querySelector(flow.selector).dataset.flowstart = "start";
        }

        content
          .querySelector(flow.selector)
          .insertAdjacentHTML("afterbegin", `<span class="flow-start"></span>`);

        content
          .querySelector(flow.selector)
          .classList.add(`parallel-obj-${flowName}`);

        content.querySelector(flow.selector).dataset.height =
          testedFlow.offsetHeight;

        content.querySelector(flow.selector).dataset.flowId =
          `parallel-obj-${flowName}-${selectorIndex}`;

        content.querySelector(flow.selector).dataset.flowName = `${flowName}`;

        flow.height = testedFlow.offsetHeight;
        testedFlow.classList.add(`parallel-obj-${flowName}`);
        testedFlow.dataset.height = testedFlow.offsetHeight;
        testedFlow.dataset.flowId = `parallel-obj-${flowName}-${selectorIndex}`;
        testedFlow.dataset.flowName = `${flowName}`;
      });

      let parallelElements = Array.from(
        document.querySelectorAll(`.parallel-obj-${flowName}`),
      );
      let biggestHeightId = parallelElements.reduce(
        (max, el) =>
          parseInt(el.dataset.height) > parseInt(max.dataset.height) ? el : max,
        parallelElements[0],
      ).dataset.flowId;

      content.querySelector(
        `[data-flow-id="${biggestHeightId}"]`,
      ).dataset.mainObjInFlow = "true";

      content
        .querySelector(`[data-flowstart]`)
        .insertAdjacentElement(
          "beforebegin",
          content.querySelector(`[data-flow-id="${biggestHeightId}"]`),
        );

      parallelElements.forEach((el) => {
        if (el.dataset.flowId != biggestHeightId) {
          content.append(
            content.querySelector(`[data-flow-id="${el.dataset.flowId}"]`),
          );
        }
      });
    });
    document.querySelector("#parallel-removeme").remove();
  }

  renderNode(node) {
    if (this.flowLocation != "samepage") {
      return;
      console.log(
        "we dont put the things on the same page, we’re on same spread",
      );
    }
    if (node.nodeType == 1) {
      if (node.closest("[data-main-obj-in-flow]")) return;

      if (node.dataset.flowStart) {
        return;
        //console.log(`the flow start now`);
      }

      if (node.className.includes("flow-start")) {
        return;
      }

      if (node.closest("[data-flow-name]")) {
        let flowName = node.closest("[data-flow-name]").dataset.flowName;
        let flowId = node.closest("[data-flow-name]").dataset.flowId;

        const pageNumber = getPageNumber(node);

        if (!document.querySelector(`[data-flow-id="${flowId}"] .flow-start`)) {
          return;
          console.log(`the flow really didnt started there , like the party`);
        }
        let firstPageOfThisFlow = getPageNumber(
          document.querySelector(`[data-flow-id="${flowId}"] .flow-start`),
        );

        let map = pageNumber - firstPageOfThisFlow;

        let pagesInTrackers = this.flowTracker.find(
          (a) => a.flow == flowName,
        ).pages;

        if (pagesInTrackers.length > 0) {
          pagesInTrackers[map].elements.forEach((el) => {
            let clone = document.querySelector(`#${el.id}`).cloneNode(true);
            if (
              !node.closest(".pagedjs_page").querySelector(`#${el.id}-clone`)
            ) {
              clone.id = el.id + "-clone";
              clone.dataset.id = clone.id;
              clone.dataset.ref = "unset";
              clone.setAttribute(
                "style",
                `width: ${el.offsetWidth}px ; height: ${el.offsetHeight}px ;  top: ${el.offsetTop}px; left: ${el.offsetLeft}px; position: absolute;`,
              );
              clone.style.position = "absolute;";

              node
                .closest(".pagedjs_page_content")
                .querySelector("div")
                .insertAdjacentElement("afterbegin", clone);

              console.log(
                "there is a clonable element on page",
                pageNumber,
                firstPageOfThisFlow,
                map,
              );
            }
            node.closest(`[data-flow-name]`).style.minHeight = "100%";

            if (node.closest(`.pagedjs_page`).querySelector(`#${clone.id}`)) {
              let overlap = checkOverlap(
                node
                  .closest(`.pagedjs_page`)
                  .querySelector(`#${clone.id}`)
                  .getBoundingClientRect(),
                node.closest(`[data-flow-name]`).getBoundingClientRect(),
              );

              if (overlap) {
                createOverlapElement(
                  overlap,
                  node.closest("[data-flow-name]"),
                  20,
                  `${el.id}-overlap`,
                );
              }
            }
          });
        }
      }
    }
  }

  async finalizePage(page) {
    if (page.querySelector("[data-main-obj-in-flow]")) {
      let impacts = page.querySelectorAll(".parallel-impact");

      let flowName = page.querySelector("[data-flow-name]").dataset.flowName;

      let flowtracker = this.flowTracker.find((a) => a.flow == flowName);

      if (!flowtracker) {
        flowtracker = this.flowTracker.push({
          flow: flowName,
          pages: [],
        });
      }

      let elementsToTakeIntoAccount = [];

      impacts.forEach((element) => {
        elementsToTakeIntoAccount.push({
          id: element.id,
          offsetTop: element.offsetTop,
          offsetLeft: element.offsetLeft,
          offsetWidth: element.offsetWidth,
          offsetHeight: element.offsetHeight,
        });
      });

      this.flowTracker
        .find((a) => a.flow == flowName)
        .pages.push({
          page: page.id.replace("page-", ""),
          elements: elementsToTakeIntoAccount,
        });
    }

    if (this.flowSpreadAddWhite) {
      if (page.querySelector("[data-main-obj-in-flow]")) {
        this.parallelFLows.forEach(async (pflow) => {
          let newpage = this.chunker.addPage();
          newpage.element?.classList.add("addedpage");
          newpage.element?.classList.add("pagedjs_named_page");
          newpage.element?.classList.add("pagedjs_pagedjs-fullpage_page");

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
        });
      }
    }
  }

  afterRendered(pages) {
    console.warn(
      "pagedjs is finished, any error here with next sibling or whatever will not impact us.",
    );

    this.parallelFLows.forEach((pflow) => {
      let hostId = getBiggestHeight(pflow.selectors);
      let hostObj = document.querySelectorAll(hostId.selector);
      let guestIds = getAllButBiggestHeight(pflow.selectors);
      let guestsObj = [];

      guestIds.forEach((gu) => {
        guestsObj.push(document.querySelectorAll(gu.selector));
      });

      let guests = [];

      guestIds.forEach((selectors) => {
        guests = [...document.querySelectorAll(hostId.selector)];
      });

      if (this.flowLocation == "samepage") {
        guestsObj.forEach((guests) => {
          for (let i = 0; i < hostObj.length; i++) {
            if (hostObj[i] && guests[i]) {
              let obj = guests[i];

              let pageToRemove = guests[i].closest(".pagedjs_page");

              obj.style.left = `${obj.offsetLeft}px`;
              obj.style.width = `${obj.offsetWidth}px`;
              obj.style.top = `${obj.offsetTop}px`;
              obj.style.height = `${obj.offsetHeight}px`;
              obj.style.position = "absolute";

              hostObj[i]
                .closest(".pagedjs_page_content")
                .querySelector("div")
                .insertAdjacentElement("beforeend", obj);

              // pageToRemove.remove();
            }
          }
        });
      } else if (this.flowLocation == "samespread") {
        let diff = hostObj.length - guestsObj.length;

        guestsObj.forEach((guests) => {
          for (let i = 0; i < hostObj.length; i++) {
            if (hostObj[i] && guests[i]) {
              if (this.flowSpreadAddWhite) {
                hostObj[i]
                  .closest(".pagedjs_page")
                  .nextElementSibling.querySelector(".pagedjs_page_content")
                  .insertAdjacentHTML("afterbegin", `<div></div>`);
                let previousPage = guests[i].closest(".pagedjs_page");
                hostObj[i]
                  .closest(".pagedjs_page")
                  .nextElementSibling.querySelector(".pagedjs_page_content div")
                  .insertAdjacentElement("afterbegin", guests[i]);
                // remove the empty page at the end.
                previousPage.remove();
              } else {
                // bring the content back;
                hostObj[i]
                  .closest(".pagedjs_page")
                  .insertAdjacentElement(
                    "beforebegin",
                    guests[i].closest(".pagedjs_page"),
                  );
              }
            }
          }
        });
      }
    });
  }
}
Paged.registerHandlers(multilang);
function getBiggestHeight(arr) {
  return arr.reduce(
    (max, obj) => (obj.height > max.height ? obj : max),
    arr[0],
  );
}
function getAllButBiggestHeight(arr) {
  const biggest = getBiggestHeight(arr);
  return arr.filter((obj) => obj !== biggest);
}
function getPageNumber(obj) {
  if (!obj) return undefined;
  return obj.closest(".pagedjs_page").id.replace("page-", "");
}

function checkOverlap(rect1, rect2) {
  if (!rect1 || !rect2) return console.log("there is no rect 1 or rect 2");
  // Check if the rectangles intersect
  const xOverlap = rect1.left < rect2.right && rect1.right > rect2.left;
  const yOverlap = rect1.top < rect2.bottom && rect1.bottom > rect2.top;

  if (xOverlap && yOverlap) {
    const overlapX = Math.max(rect1.left, rect2.left);
    const overlapY = Math.max(rect1.top, rect2.top);
    const overlapWidth = Math.min(rect1.right, rect2.right) - overlapX;
    const overlapHeight = Math.min(rect1.bottom, rect2.bottom) - overlapY;

    return {
      x: overlapX - rect2.left,
      y: overlapY - rect2.top,
      width: overlapWidth,
      height: overlapHeight,
    };
  }

  return null; // No overlap
}

function createOverlapElement(overlap, box2element, offset = 16, id) {
  const overlapElement = document.createElement("div");
  overlapElement.classList.add("overlap");

  overlapElement.style.width = `${overlap.width + offset}px`;
  overlapElement.style.height = `${overlap.height + offset}px`;
  overlapElement.style.marginTop = `${overlap.y - offset / 2}px`;
  overlapElement.style.marginLeft = `${overlap.x - offset / 2}px`;
  overlapElement.style.float = `left`;
  overlapElement.style.shapeOutside = `content-box`;
  overlapElement.id = id;
  overlapElement.dataset.id = id;

  box2element.insertAdjacentElement("afterbegin", overlapElement);
}
