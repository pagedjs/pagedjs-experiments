
class moveToNextPagePost extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.nextPage = [];
    this.prevPage = [];
  }
  onDeclaration(declaration, dItem, dList, rule) {
    if (declaration.property == "--experimental-post-page") {
      if (declaration.value.value.includes("next")) {
        let sel = csstree.generate(rule.ruleNode.prelude);
        sel = sel.replace('[data-id="', "#");
        sel = sel.replace('"]', "");
        this.nextPage.push(sel.split(","));
        console.log("next: ", this.nextPage);
      } else if (declaration.value.value.includes("previous")) {
        let sel = csstree.generate(rule.ruleNode.prelude);
        sel = sel.replace('[data-id="', "#");
        sel = sel.replace('"]', "");
        this.prevPage.push(sel.split(","));
        console.log("prev: ", this.prevPage);
      }
    }
    // spacing
  }

  afterParsed(parsed) {
    if (this.nextPage.length > 0) {
      this.nextPage.forEach((el) => {
        const elem = parsed.querySelector(el);
        if (!elem) {
          return;
        }
        // if elem has an id
        if(elem.id) {
          elem.id = `movedNext{elem.id}`
        } else {

          elem.id = `movedNext-${elem.closest('[id]').id}`
        }
        elem.classList.add('moveToNextPage');
      })}
      if (this.prevPage.length > 0) {
        this.prevPage.forEach((el) => {
          const elem = parsed.querySelector(el);
          if (!elem) {
            return;
          }
          // if elem has an id
          if(elem.id) {
            elem.id = `movedPrev${elem.id}`
          } else {

            elem.id = `movedPrev-${elem.closest('[id]').id}`
          }
          elem.classList.add('moveToPrevPage');
        })
      }
      }


  afterRendered(pages) {
    document.querySelectorAll('.moveToPrevPage').forEach( (moved ) =>{
      const pageToMoveFrom = moved.closest('.pagedjs_page');
      const pageToMoveTo = pageToMoveFrom.previousElementSibling.querySelector('.cap-wrapper');
      moved.classList.remove("moveToPrevPage") 
     if (!pageToMoveTo) {
        console.log('null')
        createWrap(pageToMoveFrom.previousElementSibling);
      }
      pageToMoveFrom.previousElementSibling.querySelector('.cap-wrapper').append( moved);
        
    }) 
    document.querySelectorAll('.moveToNextPage').forEach( (moved ) =>{
      const pageToMoveFrom = moved.closest('.pagedjs_page');
      const pageToMoveTo = pageToMoveFrom.nextElementSibling.querySelector('.cap-wrapper');
      moved.classList.remove("moveToNextPage") 
      moved.classList.add("movedFromNextPage") 
     if (!pageToMoveTo) {
        console.log('null')
        createWrap(pageToMoveFrom.nextElementSibling);
      }
      pageToMoveFrom.nextElementSibling.querySelector('.cap-wrapper').append( moved);
        
    }) 
  }
}


Paged.registerHandlers(moveToNextPagePost);

function createWrap(page) {

        let capWrapper = document.createElement("div");
        capWrapper.classList.add("cap-wrapper");
        capWrapper.style = "position: absolute; bottom: 0px; align-items: end; display: flex;"
          page
          .querySelector(".pagedjs_page_content")
          .insertAdjacentElement("afterbegin", capWrapper);
      }
