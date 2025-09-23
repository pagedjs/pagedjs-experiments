class pagedjsNotes extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);

    this.pagedMarginNotes = [];
  }

  onDeclaration(declaration, dItem, dList, rule) {
    //find the note in the margin from the blok
    //location can be left, right, inside, outside

    if (declaration.property == "--paged-margin-notes") {
      let selectors = csstree.generate(rule.ruleNode.prelude);
      selectors = selectors.replaceAll('[data-id="', "#");
      selectors = selectors.replaceAll('"]', "");
      let itemsList = selectors.split(",");
      itemsList.forEach((selector) => {
        this.pagedMarginNotes.push({
          selector: selector,
          location: declaration.value.value.trim(),
        });
      });
    }
  }

  // TODO: make that one work
  //
  beforeParsed(content) {
    let notes = [];
    // find the notes and apply a class AND a marginnote location
    this.pagedMarginNotes.forEach((note) => {
      content.querySelectorAll(note.selector).forEach((noteelement) => {
        noteelement.classList.add("paged-margin-note");
        noteelement.classList.add("pagednote");
        noteelement.dataset.noteId = `${note.selector.replace(".", "").replace("#", "")}-${note.location}`;
        noteelement.dataset.pagedMarginNoteLocation = `${note.location}`;
        notes.push(noteelement);
      });
    });

    // add note marker and note callout
    for (let i = 0; i < notes.length; ++i) {
      //spancall
      let spanCall = document.createElement("span");
      spanCall.classList.add("note-callout");
      spanCall.classList.add("note-call_" + notes[i].dataset.noteId);
      spanCall.dataset.noteCounter = i;
      spanCall.innerHTML = i + 1;
      notes[i].insertAdjacentElement("beforebegin", spanCall);

      // Add marker notes
      var spanMarker = document.createElement("span");
      spanMarker.classList.add("note-marker");
      spanMarker.classList.add("note-marker_" + notes[i].dataset.noteId);
      spanMarker.dataset.noteMarker = notes[i].dataset.noteId + "-" + i + 1;
      spanMarker.dataset.noteCounter = i + 1;
      spanMarker.innerHTML = `${i + 1}.`;
      spanMarker.dataset.noteCounter = i;
      notes[i].insertAdjacentElement("afterbegin", spanMarker);
    }
  }

  async finalizePage(page) {
    const blockThingy = document.createElement("div");
    blockThingy.classList.add("renvoiBlock");

    let pageElements = page.querySelectorAll(".pagednote");

    pageElements.forEach((el, index) => {
      console.log(el);
      if (el.previousElementSibling) {
        el.previousElementSibling.dataset.offsetTop =
          el.previousElementSibling?.offsetTop;
      }
      el.dataset.offsetTop = el.offsetTop;
      let offset = 0;
      el.style.top = el.dataset.offsetTop - offset + "px";
      el.style.position = "absolute";
      blockThingy.insertAdjacentElement("beforeend", el);
    });

    // check here if the notes are ok

    page
      .querySelector(".pagedjs_page_content")
      .insertAdjacentElement("beforeend", blockThingy);

    // try to move things here
    //  once the page is done, check the whole thing

    const allnotes = page.querySelectorAll(".pagednote");

    //height of all the notes
    const pageHeight = page.querySelector(".pagedjs_page_content").offsetHeight;
    let noteHeight = 0;

    allnotes.forEach((note) => {
      noteHeight += note.offsetHeight;
    });

    // add check to see when there is more note than page height so the author can make a decision.
    if (noteHeight > pageHeight) {
      allnotes.forEach((note) => {
        note.style.position = "unset";
        note.style.marginBottom = ".3em";
        note.style.color = "green";
      });
    }

    // move notes bottom when they touch each others.
    // add some text indent to the note? or reverse text indent?
    allnotes.forEach((el) => {
      let previousNote = el.previousElementSibling;
      if (previousNote) {
        if (
          previousNote?.offsetTop + previousNote?.offsetHeight >=
          el.offsetTop
        ) {
          // put them in the same div and manage the couples of notes with the div.
          el.classList.add("overlap");
          el.dataset.topLocation =
            previousNote.offsetTop + previousNote.offsetHeight;
          el.style.top = el.dataset.topLocation + "px";
          // console.log(page.querySelector(".pagedjs_page_content").offsetHeight)
        }
      }
    });

    //check if the notes goes too down
    //

    // if there is not note get back
    if (allnotes.length == 0) return;

    let lastnote = [...allnotes].pop();

    // check if page overflow
    let pageOverflow =
      Number(lastnote.offsetHeight) + Number(lastnote.dataset.offsetTop);

    if (pageOverflow > pageHeight) {
      //put the last note at the bottom and check the height to push up anything touching.
      lastnote.style.top = "unset";
      lastnote.style.bottom = 0;
      //while last note overlap the previous note
      while (
        lastnote.offsetTop <
        lastnote.previousElementSibling?.offsetHeight +
          lastnote.previousElementSibling?.offsetTop
      ) {
        lastnote.previousElementSibling.style.top = "unset";
        lastnote.previousElementSibling.style.bottom =
          lastnote.offsetHeight + 8 + "px";
        lastnote = lastnote.previousElementSibling;
      }
    }
  }

  afterRendered(pages) {
    console.log("did some notes!");
  }
}
Paged.registerHandlers(pagedjsNotes);

/* No hyphens between pages */
/* warning : may cause polyfill errors */

class noHyphenBetweenPage extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.hyphenToken;
  }

  afterPageLayout(pageFragment, page, breakToken) {
    if (pageFragment.querySelector(".pagedjs_hyphen")) {
      // find the hyphenated word
      let block = pageFragment.querySelector(".pagedjs_hyphen");

      // i dont know what that line was for :thinking: i removed it
      // block.dataset.ref = this.prevHyphen;

      // move the breakToken
      let offsetMove = getFinalWord(block.innerHTML).length;

      // move the token accordingly
      page.breakToken = page.endToken.offset - offsetMove;

      // remove the last word
      block.innerHTML = block.innerHTML.replace(
        getFinalWord(block.innerHTML),
        "",
      );

      breakToken.offset = page.endToken.offset - offsetMove;
    }
  }
}

// Paged.registerHandlers(noHyphenBetweenPage);

function getFinalWord(words) {
  var n = words.split(" ");
  return n[n.length - 1];
}
