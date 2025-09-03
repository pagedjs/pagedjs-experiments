//    --------------------------------------------------------
//    Note for the user :D
//
//    HELLO, I HOPE YOU’RE DOING GOOD :D
//    IF YOU FIND THAT SCRIPT, PLEASE WAIT FOR THE SCRIPT RELEASE PARTY
//    THAT WE’LL THROW EARLY APRIL 2025 BEFORE PUTTING THOSE FILES
//    IN ANY PUBLIC SPACE. THANK YOU!
//
//    --------------------------------------------------------
//
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

import * as csstree from "css-tree";
import { Handler } from "pagedjs";

export class multilang extends Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);

    // to put the content on the same spread
    // this.flowLocation = "samespread";

    // you can add one page if there are differences in page numbers between flows [only work with 2 flows]
    // this.flowSpreadAddWhite = true;

    // to put the content on the same page
    this.flowLocation = "samepage";

    // this.parallelFlows will find the flows from the css;
    this.parallelFlows = [];

    // this.tracker will keep tack of the flows
    this.flowTracker = [];

    this.parallelImpacts = [];

    // NEW: Section sync within flows
    this.chapterSelector = "h3";
    this.sectionSync = true; // Enable section synchronization

    this.footnoteLayout = "end-document"; // 'margin' or 'end-document'
  }

  // ENHANCED METHOD: Extract chapter number with more patterns
  extractChapterNumber(text) {
    const patterns = [
      /chapter\s*(\d+)/i,
      /chapitre\s*(\d+)/i,
      /kapitel\s*(\d+)/i,
      /^(\d+)[\.\s]/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return parseInt(match[1]);
    }

    return null;
  }

  onDeclaration(declaration, dItem, dList, rule) {
    // condition
    if (this.flowLocation !== "samespread" && this.flowLocation !== "samepage")
      this.flowLocation = "samespread";
    if (declaration.property == "--parallel-flow") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");
      let itemsList = sel.split(",");
      itemsList.forEach((el) => {
        let flow = this.parallelFlows.find((a) => {
          return a.flow == declaration.value.value.trim();
        });
        if (flow) {
          flow.selectors.push({ selector: el, height: 0 });
        } else {
          this.parallelFlows.push({
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

  configureFootnotes() {
    const footnotesHandler = window.dualFootnotesHandler;

    if (footnotesHandler) {
      if (
        this.flowLocation === "samepage" &&
        this.footnoteLayout === "margin"
      ) {
        // Layout 2: Bottom margin footnotes
        footnotesHandler.setMode("margin", { sectionFootnotes: true });
        console.log("📝 Using margin footnotes for parallel layout");

        // Add CSS class for styling
        document.body.classList.add("layout-parallel-margin");
      } else {
        // Layout 1: End-of-document footnotes
        footnotesHandler.setMode("end-document");
        console.log("📝 Using end-of-document footnotes");

        // Add CSS class for styling
        document.body.classList.add("layout-end-document");
      }
    }
  }

  beforeParsed(content, chunker) {
    // this.parallel impacts
    this.parallelImpacts.forEach((sel) => {
      content.querySelectorAll(sel).forEach((el) => {
        el.classList.add("parallel-impact");
      });
    });

    this.parallelFlows.forEach((flow) => {
      flow.selectors = flow.selectors.filter((e) =>
        content.querySelector(e.selector),
      );
    });

    document.body.insertAdjacentHTML(
      "beforeend",
      htmlTemplate("find-if-its-a-named-page", "find-if-its-the-first-one"),
    );

    // render the parallel flows
    this.parallelFlows.forEach((flows, flowsIndex) => {
      //name of the flow
      let flowName = this.parallelFlows[flowsIndex].flow;

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
      console.log(flows);
      console.log(parallelElements);
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

    this.configureFootnotes();
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
                `width: ${el.offsetWidth}px ; height: ${el.offsetHeight}px ;  top: ${el.offsetTop}px; left: ${el.offsetLeft - 50}px; position: absolute;`,
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
    // console.log(page.dataset.pageNumber)

    if (page.querySelector("[data-main-obj-in-flow]")) {
      let impacts = page.querySelectorAll(".parallel-impact");

      let flowName = page.querySelector("[data-flow-name]").dataset.flowName;

      let flowtracker = this.flowTracker.find((a) => a.flow == flowName);

      if (!flowtracker) {
        this.flowTracker.push({
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
        this.parallelFlows.forEach(async (pflow) => {
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
    console.warn("pagedjs is finished, doing simple sync logic...");

    this.parallelFlows.forEach((pflow) => {
      // Get host/guest as before
      let hostId = getBiggestHeight(pflow.selectors);
      let hostElements = document.querySelectorAll(hostId.selector);
      let guestIds = getAllButBiggestHeight(pflow.selectors);

      guestIds.forEach((guestId) => {
        let guestElements = document.querySelectorAll(guestId.selector);

        if (this.flowLocation == "samepage") {
          if (this.sectionSync) {
            // NEW: Get sync marks for both
            let hostSyncMarks = this.getSyncMarks(hostElements);
            let guestSyncMarks = this.getSyncMarks(guestElements);

            console.log(`Host sync marks: ${hostSyncMarks.length}`);
            console.log(`Guest sync marks: ${guestSyncMarks.length}`);

            this.positionWithSync(
              hostElements,
              guestElements,
              hostSyncMarks,
              guestSyncMarks,
            );
          } else {
            // ORIGINAL: Simple index-based positioning
            console.log("📄 Using original index-based positioning");
            const guestArray = Array.from(guestElements);
            for (let i = 0; i < hostElements.length; i++) {
              if (hostElements[i] && guestArray[i]) {
                this.positionGuestElement(guestArray[i], hostElements[i]);
              }
            }
          }
          // Handle footnotes for parallel layout
          if (this.footnoteLayout === "margin") {
            this.handleParallelFootnotes(hostElements, guestElements);
          }
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
                    .nextElementSibling.querySelector(
                      ".pagedjs_page_content div",
                    )
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
    });
    // Handle end-of-document footnotes
    if (this.footnoteLayout === "end-document") {
      this.handleEndDocumentFootnotes();
    }
  }

  // NEW: Handle footnotes in parallel layout
  handleParallelFootnotes(hostElements, guestElements) {
    console.log("📝 Positioning footnotes for parallel layout...");

    // Position footnote areas alongside content
    Array.from(hostElements).forEach((hostElement, index) => {
      const hostFootnoteArea = hostElement.querySelector(
        ".pagedjs_footnote_area",
      );
      const guestElement = guestElements[index];
      const guestFootnoteArea = guestElement?.querySelector(
        ".pagedjs_footnote_area",
      );

      if (hostFootnoteArea) {
        // Position host footnotes (usually right side)
        hostFootnoteArea.style.position = "absolute";
        hostFootnoteArea.style.right = "0";
        hostFootnoteArea.style.width = "45%";
        hostFootnoteArea.style.bottom = "20px";
      }

      if (guestFootnoteArea) {
        // Position guest footnotes (usually left side)
        guestFootnoteArea.style.position = "absolute";
        guestFootnoteArea.style.left = "0";
        guestFootnoteArea.style.width = "45%";
        guestFootnoteArea.style.bottom = "20px";
      }
    });
  }

  // NEW: Handle end-of-document footnotes
  handleEndDocumentFootnotes() {
    const footnotesHandler = window.dualFootnotesHandler;

    if (footnotesHandler) {
      footnotesHandler.integrateWithMultiFlow("end-document");
    }
  }

  // Method to switch footnote layout
  setFootnoteLayout(layout) {
    this.footnoteLayout = layout; // 'margin' or 'end-document'
    console.log(`📝 Footnote layout set to: ${layout}`);
  }

  getSyncMarks(elements) {
    const syncMarks = [];

    Array.from(elements).forEach((element, index) => {
      const hasSyncMark = element.querySelector(this.chapterSelector); // h3
      if (hasSyncMark) {
        syncMarks.push({
          elementIndex: index,
          element: element,
          syncText: hasSyncMark.textContent.trim(),
        });
      }
    });

    console.log(syncMarks);
    return syncMarks;
  }

  positionWithSync(hostElements, guestElements, hostSyncMarks, guestSyncMarks) {
    console.log("🔗 Starting sync-aware positioning...");

    const hostArray = Array.from(hostElements);
    const guestArray = Array.from(guestElements);

    let hostIndex = 0;
    let guestIndex = 0;
    let hostSyncIndex = 0;
    let guestSyncIndex = 0;

    while (hostIndex < hostArray.length && guestIndex < guestArray.length) {
      const hostElement = hostArray[hostIndex];
      const guestElement = guestArray[guestIndex];

      // Check if current elements are sync marks
      const hostIsSyncMark =
        hostSyncIndex < hostSyncMarks.length &&
        hostSyncMarks[hostSyncIndex].elementIndex === hostIndex;
      const guestIsSyncMark =
        guestSyncIndex < guestSyncMarks.length &&
        guestSyncMarks[guestSyncIndex].elementIndex === guestIndex;

      console.log(
        `Comparing host[${hostIndex}] (sync: ${hostIsSyncMark}) with guest[${guestIndex}] (sync: ${guestIsSyncMark})`,
      );

      if (hostIsSyncMark && guestIsSyncMark) {
        // Both are sync marks - check if they match
        const hostText = hostSyncMarks[hostSyncIndex].syncText;
        const guestText = guestSyncMarks[guestSyncIndex].syncText;

        if (this.chaptersMatch(hostText, guestText)) {
          console.log(`✅ Sync match: "${hostText}" ↔ "${guestText}"`);
          this.positionGuestElement(guestElement, hostElement);

          hostIndex++;
          guestIndex++;
          hostSyncIndex++;
          guestSyncIndex++;
        } else {
          console.log(`❌ Sync mismatch: "${hostText}" vs "${guestText}"`);
          // Skip the guest that doesn't match
          guestIndex++;
          guestSyncIndex++;
        }
      } else if (hostIsSyncMark && !guestIsSyncMark) {
        // Host is sync mark, guest is not - skip guest until we find matching sync
        console.log(`⏭️ Skipping guest[${guestIndex}] - waiting for sync mark`);
        guestIndex++;
      } else if (!hostIsSyncMark && guestIsSyncMark) {
        // Guest is sync mark, host is not - insert blank to push guest down
        console.log(
          `📄 Inserting blank for host[${hostIndex}] - pushing guest sync down`,
        );

        // Position current host with a blank/invisible guest element
        this.insertBlankGuest(hostElement);

        // Move host forward, keep guest at same position for next iteration
        hostIndex++;
        // Don't increment guestIndex or guestSyncIndex - we want to try this guest again
      } else {
        // Neither is sync mark - normal positioning
        console.log(
          `📄 Normal positioning: host[${hostIndex}] with guest[${guestIndex}]`,
        );
        this.positionGuestElement(guestElement, hostElement);

        hostIndex++;
        guestIndex++;
      }
    }

    console.log(
      `🏁 Sync positioning complete. Host: ${hostIndex}/${hostArray.length}, Guest: ${guestIndex}/${guestArray.length}`,
    );
  }

  insertBlankGuest(hostElement) {
    // Create an invisible spacer element
    const blankElement = document.createElement("div");
    blankElement.className = "sync-blank-spacer";
    blankElement.style.position = "absolute";
    blankElement.style.width = "0px";
    blankElement.style.height = "0px";
    blankElement.style.visibility = "hidden";

    // Position it like a normal guest
    hostElement
      .closest(".pagedjs_page_content")
      .querySelector("div")
      .insertAdjacentElement("beforeend", blankElement);

    console.log(`  📦 Inserted blank spacer for host element`);
  }

  chaptersMatch(hostText, guestText) {
    // Extract numbers from chapter titles
    const hostNum = this.extractChapterNumber(hostText);
    const guestNum = this.extractChapterNumber(guestText);

    if (hostNum !== null && guestNum !== null) {
      return hostNum === guestNum;
    }

    // Fallback to exact text match
    return hostText === guestText;
  }

  // EXTRACTED METHOD: Position a single guest element
  positionGuestElement(guestElement, hostElement) {
    const pageToRemove = guestElement.closest(".pagedjs_page");

    guestElement.style.left = `${guestElement.offsetLeft}px`;
    guestElement.style.width = `${guestElement.offsetWidth}px`;
    guestElement.style.position = "absolute";
    guestElement.style.top = `${guestElement.offsetTop}px`;
    guestElement.style.height = `${guestElement.offsetHeight}px`;

    hostElement
      .closest(".pagedjs_page_content")
      .querySelector("div")
      .insertAdjacentElement("beforeend", guestElement);

    pageToRemove.remove();
  }
}
// Paged.registerHandlers(multilang);
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
