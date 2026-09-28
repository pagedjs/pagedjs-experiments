// version 3 - 09/2021


// hyphenate function 


// Whitelist : word that can be hyphenated even if there is an initial cap
const whitelist = new Array(

);

// Blacklist : les mots qui seront insécables quoi qu'il arrive word that wont be hyphenated
const blacklist = new Array(

);


class insecables extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }
  beforeParsed(content) {
    // add lang fr to all sections

    content.querySelectorAll("section").forEach(section => {
      section.setAttribute("lang", "fr")
    })


    // Look for word with Cap

    var regexCapital = /((?<!((\.|\?|\!)))(\s|[\'\"\’\(]|\>)(([A-ZÉÈÁÀÙÂÊÄËÎÏÔÖÛÜČ][A-zÉÈÁÀÙÂÊÄËÎÏÔÖÛÜČœæçéáàùâäêëîïôöûü\-]*)+(?: [A-ZÉÈÁÀÙÂÊÄËÎÏÔÖÛÜČ][A-zÉÈÁÀÙÂÊÄËÎÏÔÖÛÜČœæçéáàùâäêëîïôöûü\-]+)*)(\s|[\,\.\<]))/g;

    // gestion optionnelle des nbsp; 
    // gestion des tirets d'incise (-)

    var insecable = /((?<!((\.|\?|\!)))(\s|[\'\"\’\(]|\>)(([A-zÉÈÁÀÙÂÊÄËÎÏÔÖÛÜČœæçéáàùâäêëîïôöûü\-–]*|[0-9]*)(\&nbsp;|\&#x00A0;|\&#x202F;|&#160;|&#x202F;)([A-zÉÈÁÀÙÂÊÄËÎÏÔÖÛÜČœæçéáàùâäêëîïôöûü\-–]*|[0-9]*)*)(\s|[\,\.\<]))/g;


    // replacements

    var paragraph = content.querySelectorAll("section p, section p *, section .footnote");

    paragraph.forEach(element => {

      element.innerHTML = element.innerHTML.replace(regexCapital, '$4<span class="noHyphen">$5</span>$7');

      whitelist.forEach(whitelistWord => {
        element.innerHTML = element.innerHTML.replace(whitelistWord, '<span class="forceHyphen">' + whitelistWord + '</span>');
      });
      blacklist.forEach(blacklistWord => {
        element.innerHTML = element.innerHTML.replaceAll(blacklistWord, '<span class="noHyphen">' + blacklistWord + '</span>');
      });

      element.innerHTML = element.innerHTML.replace(insecable, '$4<span class="noWrap">$5</span>$9');

    })


    // then run hyphenopoly

    Object.keys(Hyphenopoly.setup.selectors).forEach(sel => {
      content.querySelectorAll(sel).forEach(elem => {
        Hyphenopoly.hyphenators["HTML"].then((hyn) => {
          hyn(elem, sel);
        });
      });
    });
    

  }


  afterRendered(pages) {
    console.log(`end!`)
    document.querySelector('html').style.visibility = 'visible';

  }
}

Paged.registerHandlers(insecables);


/* No hyphens between pages */
/* warning : may cause polyfill errors */


class noHyphenBetweenPage extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.hyphenToken;
  }

  afterPageLayout(pageFragment, page, breakToken) {

    if (pageFragment.querySelector('.pagedjs_hyphen')) {

      // find the hyphenated word  
      let block = pageFragment.querySelector('.pagedjs_hyphen');

      block.dataset.ref = this.prevHyphen;

      // move the breakToken
      let offsetMove = getFinalWord(block.innerHTML).length;

      // move the token accordingly
      page.breakToken = page.endToken.offset - offsetMove;

      // remove the last word
      block.innerHTML = block.innerHTML.replace(getFinalWord(block.innerHTML), "");

      breakToken.offset = page.endToken.offset - offsetMove;

    }
  }

}

Paged.registerHandlers(noHyphenBetweenPage);

function getFinalWord(words) {
  var n = words.split(" ");
  return n[n.length - 1];
}

