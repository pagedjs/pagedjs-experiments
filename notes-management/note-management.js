/*script to handle note in different ways using paged.js and custom script*/

class MyHandler extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.pagednotetype = [];
  }

  onDeclaration(declaration, dItem, dList, rule) {
    if (declaration.property == "--paged-note-type") {
      let sel = csstree.generate(rule.ruleNode.prelude);
      sel = sel.replace('[data-id="', "#");
      sel = sel.replace('"]', "");
      let itemsList = sel.split(",");
      this.pagednotetype.push({
        type: declaration.value.value.trim(),
        sel: itemsList,
      });
    }
  }

  beforeParsed(content) {
    const chapters = content.querySelectorAll(".chapter");
    // reorganisation des notes
    chapters.forEach((chap, index) => {
      chap.querySelectorAll(".footnote-ref").forEach((ref, index) => {
        let note = chap.querySelector(
          `${ref.querySelector("a").href.replace("about:blank", "")}`,
        );
        let spanappel = document.createElement("span");
        spanappel.classList.add("footnote-ref");
        spanappel.innerHTML = index + 1;
        let spannote = document.createElement("span");
        spannote.classList.add("footnote");
        spannote.innerHTML = `<span class="note-mark">${index + 1}.</span> ${note.querySelector("p").innerHTML}`;
        ref.insertAdjacentElement("afterend", spannote);
        ref.insertAdjacentElement("beforebegin", spanappel);
        ref.remove();
      });

      chap.querySelectorAll(".footnotes, .footnotes-sep").forEach((note) => {
        note.remove();
      });

      for (let i = 0; i < this.pagednotetype.length; i++) {
        if (this.pagednotetype[i].type == "marginblock") {
          this.pagednotetype[i].sel.forEach((sel) => {
            content.querySelectorAll(sel).forEach((el) => {
              el.style.position = "absolute";
              el.classList.add("note-in-margin");
            });
          });
        } else if (this.pagednotetype[i].type == "margin-note") {
          this.pagednotetype[i].sel.forEach((sel) => {
            content.querySelectorAll(sel).forEach((el) => {
              el.style.position = "absolute";
              el.classList.add("note-in-chose");
            });
          });
        }
      }
    });
  }

  finalizePage(page, pageMeta) {
    const noteblock = document.createElement("div");
    noteblock.classList.add("noteblock");
    page.querySelectorAll(".note-in-margin").forEach((note) => {
      note.classList.add("inmargin");
      note.style.position = "initial";
      noteblock.insertAdjacentElement("beforeend", note);
      noteblock.style.position = "absolute";
    });
    page
      .querySelector(".pagedjs_margin-right")
      .insertAdjacentElement("afterbegin", noteblock);
    if (noteblock.offsetHeight > pageMeta.height) {
      page.classList.add("trouble");
      noteblock.lastElementChild.classList.add("move-to-next-page");
      console.warn(page.id, noteblock.offsetHeight);
      console.log(noteblock.lastElementChild);
    }

    //note in autreechose
    page.querySelectorAll(".note-in-chose").forEach((note) => {
      note.classList.add("onmargin");
      note.style.position = "absolute";
      page
        .querySelector(".pagedjs_margin-right")

        .insertAdjacentElement("afterbegin", note);
    });
    if (noteblock.offsetHeight > pageMeta.height) {
      page.classList.add("trouble");
      noteblock.lastElementChild.classList.add("move-to-next-page");
      console.warn(page.id, noteblock.offsetHeight);
      console.log(noteblock.lastElementChild);
    }
  }
  afterRendered(pages) {
    let note = document.querySelector(".move-to-next-page");
    let page = note.closest(".pagedjs_page");
    const nextpage = page.nextElementSibling;
    nextpage
      .querySelector(".noteblock")
      .insertAdjacentElement("afterbegin", note);
  }
}

// check for problem
Paged.registerHandlers(MyHandler);
