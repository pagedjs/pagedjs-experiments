/*script to do stuff, please comment*/

class changeMeName extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }
  onDeclaration(declaration, dItem, dList, rule) {}
  beforeParsed(content) {}
  finalizePage(page, pageMeta) {}
  afterRendered(pages) {}
}

// check for problem
Paged.registerHandlers(changeMeName);
