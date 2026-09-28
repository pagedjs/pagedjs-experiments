// config for hyphenopoly
var Hyphenopoly = {
  require: {
      "fr": "FORCEHYPHENOPOLY"
  },
//   paths: {
//       patterndir: "./js/hyphens/patterns/",
//       maindir: "./js/hyphens/"
//   },
  setup: {
      dontHyphenateClass: "noHyphen",
      safeCopy: false,
      hide: "nothing",
      exceptions: {
        "global": "atelier, anti-rubénienne, Hoch-ge-born-en, Kunst-geschi-cht-liche, Wander-jahre, Durch-leuch-tigsten, Documen-ta-tie, Gemälde-galerie, Drei-viertel-ansicht, Verstei-gerung, Marl-bo-rough, Maats-chappelijk, Font-aine-bleau, Weissen-stein, Gesamt-ver-zeichnis, schil-derijen-galerij, Sove-reignty, Seven-teenth, Tra-vel-lers"
        },
      selectors: {
          "article > p, section > p, .louvre-chapo > p": {
              hyphen: "\u00AD",
              //hyphen: "•",
              compound: "all",
              minWordLength: 7,
              leftmin: 3,
              rightmin: 3,
              orphanControl: 1,
              mixedCase: false
          },
          ".footnotes-list > li": {
              hyphen: "\u00AD",
              //hyphen: "•",
              compound: "all",
              minWordLength: 7,
              leftmin: 3,
              rightmin: 3,
              orphanControl: 1,
              mixedCase: false
          },
          // ".bibliography dd": {
          //     hyphen: "\u00AD",
          //     //hyphen: "•",
          //     compound: "all",
          //     minWordLength: 7,
          //     leftmin: 3,
          //     rightmin: 3,
          //     orphanControl: 1,
          //     mixedCase: false
          // }
      }
  }
}
