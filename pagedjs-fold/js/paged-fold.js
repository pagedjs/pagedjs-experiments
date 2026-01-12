let settings = {
  outputSize: {
    width: "210mm",
    height: "297mm",
  },
  pagePerSheet: 4,
};

class MyHandler extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  afterRendered(pages, chunker) {
    document.querySelector("template").remove();

    // Remove all the previous print rules if needed, but i’m not so sure about that
    // removePrintRules();

    // From there, i would replace all the numbering of the page by hand if needed, since we’re moving things around

    let wrapper = document.createElement("div");
    wrapper.classList.add("page-wrapper");

    //check all the pages
    let pageNumbers =
      document.querySelectorAll(".pagedjs_pages .pagedjs_page").length + 1;
    let printedpages = pageNumbers / settings.pagePerSheet + 1;

    for (let i = 1; i < printedpages; i++) {
      let newpage = document.createElement("div");
      newpage.classList.add("newpage");

      // some cheats to avoid counter issues
      newpage.style.counterReset = `page ${4 * (i - 1)}`;
      // this new page must get settings.pagePerSheet number of pages
      for (let j = 0; j < settings.pagePerSheet; j++) {
        if (!document.querySelector(".pagedjs_pages .pagedjs_page")) break;
        newpage.insertAdjacentElement(
          "beforeend",
          document.querySelector(".pagedjs_pages .pagedjs_page"),
        );
      }
      wrapper.insertAdjacentElement("beforeend", newpage);
    }
    document.body.insertAdjacentElement("beforeend", wrapper);
    document.body.insertAdjacentHTML("afterbegin", `<style>${style}</style>`);
    document.querySelector(".pagedjs_pages").remove();
    document.body.innerHTML =
      document.body.querySelector("page-wrapper").innerHTML;
  }
}

let style = `@page {
size: ${settings.outputSize.width} ${settings.outputSize.height};
}


.pagedjs_page {
margin: 0 !important;
}

@media screen {
.page-wrapper {
    display: flex;
    flex-direction: column;
}
.newpage {
    margin: 2em auto;
}
}
.newpage {
    break-before: page;
    display: grid;
    width: ${settings.outputSize.width} ;
    height: ${settings.outputSize.height};
    overflow: hidden;
    padding: 0;
grid-template-columns: repeat(${settings.pagePerSheet / 2}, var(--pagedjs-width));
grid-template-rows: repeat(${settings.pagePerSheet / 2}, var(--pagedjs-height));
    background: white;
    .pagedjs_page {
        &:nth-of-type(1) {
           background: purple;
           grid-column: 1;
           grid-row: 1;
           transform: rotate(180deg);
        }
        &:nth-of-type(2) {
           background: green;
           grid-column: 1;
           grid-row: 2;
        }
        &:nth-of-type(3) {
           background: orange;
           grid-column: 2;
           grid-row: 2;
        }
        &:nth-of-type(4) {
           background: blue;
           grid-column: 2;
           grid-row: 1;
           transform: rotate(180deg);
        }

    }
}

`;

Paged.registerHandlers(MyHandler);

function removePrintRules() {
  const sheets = document.styleSheets;

  // suppression des règles liées au support par Chropme de certaines propriétés de margin boxes

  for (const sheet of sheets) {
    const myRules = sheet.cssRules;

    const mediaRules = [];
    for (const rule of myRules) {
      if (rule instanceof CSSMediaRule) {
        mediaRules.push(rule);
      }
    }

    for (const mediaRule of mediaRules) {
      for (const pageRule of mediaRule.cssRules) {
        for (let index = 0; index < pageRule.cssRules.length; index++) {
          const rule = pageRule.cssRules[index];
          if (rule instanceof CSSMarginRule) {
            pageRule.deleteRule(index);
          }
        }
      }
    }
  }
}
