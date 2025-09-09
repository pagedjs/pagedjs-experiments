// const lookingFor = ".marginnotes";

// let classNotes = lookingFor; // ← Change the CLASS of the notes here
// let notesFloat = "right"; // ← Change the POSITION of the notes here

class marginNotes extends Paged.Handler {
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

  beforeParsed(content) {
    let notes = [];
    // find the notes and apply a class AND a marginnote location
    this.pagedMarginNotes.forEach((note) => {
      content.querySelectorAll(note.selector).forEach((noteelement) => {
        noteelement.classList.add("paged-margin-note");
        noteelement.dataset.noteId = `${note.selector}-${note.location}`;
        noteelement.dataset.pagedMarginNoteLocation = `paged-${note.location}`;
        generateStylesForNotes(note.location, note.selector);
      });
    });

    // add the number for the callout and the number for the marker
    if (notes.length <= 0) return;

    // add note marker and note callout
    for (let i = 0; i < notes.length; ++i) {
      var spanCall = document.createElement("span");
      spanCall.classList.add("note-call");
      spanCall.classList.add("note-call_" + notes[i].dataset.noteId);
      spanCall.dataset.noteCall = notes[i].dataset.noteId + "-" + i + 1;
      spanCall.innerHTML = i + 1;
      notes[i].insertAdjacentElement("beforebegin", spanCall);

      // Add marker notes
      var spanMarker = document.createElement("span");
      spanMarker.classList.add("note-marker");
      spanMarker.classList.add("note-marker_" + notes[i].dataset.noteId);
      spanMarker.dataset.noteMarker = notes[i].dataset.noteId + "-" + i + 1;
      spanMarker.dataset.noteNumbe = i + 1;
      spanMarker.innerHTML = i + 1;
      notes[i].insertAdjacentElement("afterbegin", spanMarker);

      // Hide notes to avoid rendering problems
      // notes[i].style.display = "none";
    }

    /* NOTE experimental mergeFLOAT ---------------------------------------------------------------------------------- */

    // need to change that to use the info in the css
  }

  // now let’s move things on the page (or should we wait)
  finalizePage(pageElement, pagemeta, breakToken) {
    let notes = pageElement.querySelectorAll(".paged-margin-notes");
    let noteOverflow = false;

    let notesHeightAll = [];

    if (typeof notes != "undefined" && notes != null && notes.length != 0) {
      for (let n = 0; n < notes.length; ++n) {
        // Display notes of the page
        notes[n].style.display = "inline-block";
        // Add height of the notes to array notesHeightAll
        let noteHeight = notes[n].offsetHeight;
        notesHeightAll.push(noteHeight);
        // Add margins of the notes to array notesHeightAll
        if (n >= 1) {
          let margins = biggestMargin(notes[n - 1], notes[n]);
          notesHeightAll.push(margins);
        }
      }

      /* FIT PAGE ------------------------------------------------------------------------------------- */

      // Calculate if all notes fit on the page;
      let reducer = (accumulator, currentValue) => accumulator + currentValue;
      let allHeight = notesHeightAll.reduce(reducer);
      let maxHeight = pageElement.querySelectorAll(".pagedjs_page_content")[0]
        .offsetHeight;

      if (allHeight > maxHeight) {
        /* IF DOESN'T FIT ----------------------------------------------------------------------------- */

        // positions all the notes one after the other starting from the top
        notes[0].style.top =
          parseInt(window.getComputedStyle(notes[0]).marginBottom, 10) * -1 +
          "px";
        for (let a = 1; a < notes.length; ++a) {
          let notePrev = notes[a - 1];
          let newMargin = biggestMargin(notePrev, notes[a]);
          let newTop =
            notePrev.offsetTop +
            notePrev.offsetHeight -
            marginNoteTop(notes[a]) +
            newMargin;
          notes[a].style.top = newTop + "px";
        }
        // alert
        let pageNumber = pageElement.dataset.pageNumber;
        alert(
          "Rendering issue \n ☞ A marginal note overflow on page " +
            pageNumber +
            " (this is because there is too many on this page and paged.js can't breaks notes between pages for now.)",
        );
        noteOverflow = true;
      } else {
        /* PUSH DOWN ---------------------------------------------------- */
        for (let i = 0; i < notes.length; ++i) {
          if (i >= 1) {
            let noteTop = notes[i].offsetTop;
            let notePrev = notes[i - 1];
            let newMargin = biggestMargin(notes[i], notePrev);
            let notePrevBottom =
              notePrev.offsetTop -
              marginNoteTop(notePrev) +
              notePrev.offsetHeight +
              newMargin;
            // Push down the note to bottom if it's over the previous one
            if (notePrevBottom > noteTop) {
              notes[i].style.top = notePrevBottom + "px";
            }
          }
        }

        /* PUSH UP ---------------------------------------------- */

        // Height of the page content
        let contentHeight = pageElement
          .querySelectorAll(".pagedjs_page_content")[0]
          .querySelectorAll("div")[0].offsetHeight;

        // Check if last note overflow
        let nbrLength = notes.length - 1;
        let lastNote = notes[nbrLength];
        let lastNoteHeight = lastNote.offsetHeight + marginNoteTop(lastNote);
        let noteBottom = lastNote.offsetTop + lastNoteHeight;

        if (noteBottom > contentHeight) {
          // Push up the last note
          lastNote.style.top = contentHeight - lastNoteHeight + "px";

          // Push up previous note(s) if if it's over the note
          for (let i = nbrLength; i >= 1; --i) {
            let noteLastTop = notes[i].offsetTop;
            let notePrev = notes[i - 1];
            let notePrevHeight = notePrev.offsetHeight;
            let newMargin = biggestMargin(notePrev, notes[i]);
            let notePrevBottom =
              notePrev.offsetTop + notePrev.offsetHeight + newMargin;
            if (notePrevBottom > noteLastTop) {
              notePrev.style.top =
                notes[i].offsetTop -
                marginNoteTop(notePrev) -
                notePrevHeight -
                newMargin +
                "px";
            }
          }
        } /* end push up */
      }
    }
  } /* end afterPageLayout*/
}
Paged.registerHandlers(marginNotes);

/* FUNCTIONS -------------------------------------------------------------------------------------- 
--------------------------------------------------------------------------------------------------- */

// MARGINS

function marginNoteTop(elem) {
  let marginTop = parseInt(window.getComputedStyle(elem).marginTop, 10);
  return marginTop;
}

function marginNoteBottom(elem) {
  let marginBottom = parseInt(window.getComputedStyle(elem).marginBottom, 10);
  return marginBottom;
}

function biggestMargin(a, b) {
  let margin;
  let marginBottom = marginNoteBottom(a);
  let marginTop = marginNoteTop(b);
  if (marginBottom > marginTop) {
    margin = marginBottom;
  } else {
    margin = marginTop;
  }
  return margin;
}

// ADD CSS

function addcss(cssstring) {
  var head = document.getElementsByTagName("head")[0];
  var s = document.createElement("style");
  s.setAttribute("type", "text/css");
  if (s.styleSheet) {
    // IE
    s.styleSheet.cssText = cssstring;
  } else {
    // the world
    s.appendChild(document.createTextNode(cssstring));
  }
  head.appendChild(s);
}

// CAMEL CLASS NOTE

function toCamelClassNote(elem) {
  let splitClass = elem.split("-");
  if (splitClass.length > 1) {
    for (let s = 1; s < splitClass.length; ++s) {
      let strCapilize =
        splitClass[s].charAt(0).toUpperCase() + splitClass[s].slice(1);
      splitClass[s] = strCapilize;
    }
  }
  let reducer = (accumulator, currentValue) => accumulator + currentValue;
  let classCamel = splitClass.reduce(reducer);
  return classCamel;
}

function generateStylesForNotes(marginLocation, noteSelector) {
  // set the style for the position. But maybe, it would be bettter to set their location with styles?
  // or from the css?
  let positionRight =
    "left: calc(var(--pagedjs-pagebox-width) - var(--pagedjs-margin-left) - var(--pagedjs-margin-right) - 1px); width: var(--pagedjs-margin-right);";
  let positionLeft =
    "left: calc(var(--pagedjs-margin-left)*-1 - 1px); width: var(--pagedjs-margin-left);";

  let notePosition;

  switch (marginLocation) {
    case "inside":
      notePosition = `.pagedjs_left_page ${noteSelector} { ${positionRight} } .pagedjs_right_page ${noteSelector}{ ${positionLeft} }`;
      break;

    case "left":
      notePosition = `.pagedjs_left_page ${noteSelector} {${positionLeft} } .pagedjs_right_page ${noteSelector}  {${positionLeft}}`;
      break;
    case "right":
      notePosition = `.pagedjs_left_page ${noteSelector} {${positionRight} } .pagedjs_right_page ${noteSelector}  {${positionRight}}`;
      break;

    default:
      notePosition = `.pagedjs_left_page ${noteSelector} {${positionLeft} } .pagedjs_right_page ${noteSelector}  {${positionRight}}`;
  }

  addcss(
    `body { counter-reset: callNote_${toCamelClassNote(noteSelector)} markerNote_${toCamelClassNote(noteSelector)}; } ${noteSelector} { position: absolute; text-align-last: initial; box-sizing: border-box; } .note-call${noteSelector} { counter-increment: callNote_${toCamelClassNote(noteSelector)}  ; } .note-call${noteSelector}::after { content: counter(callNote_${toCamelClassNote(noteSelector)}); } .note-marker${noteSelector} { counter-increment: markerNote_${toCamelClassNote(noteSelector)}; } .note-marker${noteSelector}::before { content: counter(markerNote_${toCamelClassNote(noteSelector)}); } ${notePosition} `,
  );
}
