class moveImgToBackground extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  afterRendered() {
    document.querySelectorAll(".moveToBackgroundImage").forEach((el, index) => {
      if (el.src) {
        const page = el.closest(".pagedjs_page");
        page.style.background = `url(${el.src})`;
        page.classList.add("imageInTheBackground");
        if (!el.id) {
          el.id = `imgToBack${index}`;
        }
        page.classList.add(`back-${el.id}`);
      }
      el.style.display = "none";
    });
  }
}

// Script line-numbers :
Paged.registerHandlers(moveImgToBackground);
