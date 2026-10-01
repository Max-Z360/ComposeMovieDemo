// Tipmi launch film, variant b — every on-screen claim is a blankable constant; blanking never re-times a shot.
const BRAND_NAME = "Tipmi";
const TAGLINE = "Chosen, not ranked.";
const CTA = "Now open for creators.";
const CTA_ALT = "Request an invite.";
const HERO_MAKER = "Mara Lindqvist", HERO_TITLE = "Still life, 03";
const SUPPORTER = "Noor Haddad";      // "" hides the ledger line
const EDITION = "1 of 25";            // "" hides "Print sold"
const CHOSEN_COUNT = "31";            // top bar "Today — 31 chosen"
const ACCENT = "#7A2E35";
const SEED = 20261001;

// Display lines: arrays = forced line breaks (L4, L9). Order L1..L11.
const COPY = {
  en: {
    L1: ["Hours to make."],
    L2: ["Seconds to vanish."],
    L3: ["Not anymore."],
    L4: ["Only the work", "worth seeing."],
    L5: ["Chosen by hand."],
    L6: ["No filler. No noise."],
    L7: ["Make it here."],
    L8: ["Your work. Your terms."],
    L9: ["For people", "who make things."],
    L10: TAGLINE,                       // "Chosen" firms 400 -> 600
    L10_firm: "Chosen",
    L11: CTA,
    ui: {
      today: "Today — " + CHOSEN_COUNT + " chosen",
      time: "10:08",
      heroCaption: HERO_MAKER + " — " + HERO_TITLE,
      studio: BRAND_NAME + " · Studio",
      warmth: "WARMTH", exposure: "EXPOSURE", grain: "GRAIN", crop: "CROP", publish: "PUBLISH",
      published: "Published today",
      ledger: [
        SUPPORTER ? "Supporter joined — " + SUPPORTER : "",
        "Tip received",
        EDITION ? "Print sold — " + EDITION : "",
      ],
    },
  },
  // zh drafts (<= 8 chars; native copywriter to finalise)
  zh: {
    L1: ["做了几小时。"],
    L2: ["几秒就淹没。"],
    L3: ["到此为止。"],
    L4: ["只看", "值得看的。"],
    L5: ["亲手挑选。"],
    L6: ["不凑数，不喧哗。"],
    L7: ["在这里创作。"],
    L8: ["你的作品，你定。"],
    L9: ["献给", "创作的人。"],
    L10: "被选中，不被排序。",
    L10_firm: "被选中",
    L11: "现向创作者开放。",
    ui: {
      today: "今日 — " + CHOSEN_COUNT + " 件入选",
      time: "10:08",
      heroCaption: HERO_MAKER + " — " + HERO_TITLE,
      studio: BRAND_NAME + " · 工作室",
      warmth: "色温", exposure: "曝光", grain: "颗粒", crop: "裁切", publish: "发布",
      published: "今日发布",
      ledger: [
        SUPPORTER ? "新支持者 — " + SUPPORTER : "",
        "收到打赏",
        EDITION ? "版画售出 — " + EDITION : "",
      ],
    },
  },
};

// Library captions (maker — series). Index 0 is the hero.
const CAPTIONS = [
  [HERO_MAKER, HERO_TITLE],
  ["Teo Adeyemi", "North light"],
  ["Ines Ferrer", "Letterforms, II"],
  ["Jun Park", "Clay, studies"],
  ["Noor Haddad", "Lido, 7 am"],
  ["Tomas Reyes", "Tide, no. 7"],
  ["Hana Ito", "Quiet hours"],
  ["Aya Toda", "Mass & void"],
  ["Jonah Keel", "Tidal, no. 4"],
  ["Elin Sato", "Dusk, 02"],
  ["Oren Baptiste", "Field notes"],
  ["Lia Moreau", "Paper, folded"],
  ["Kofi Mensah", "Contours"],
  ["Rosa Vidal", "Stillness"],
  ["Ilse Brandt", "Weather, 04"],
  ["Dae-jin Kim", "Grain field"],
  ["Yusuf Aral", "Plinth"],
  ["Clara Nyberg", "Velvet, dusk"],
  ["Ravi Menon", "Undertow"],
  ["Ada Quinn", "Seven"],
  ["Leo Marchetti", "Vessels"],
  ["Sofia Arce", "Drift lines"],
  ["Nils Ek", "Raking light"],
  ["Priya Raman", "Ochre"],
];

const LANG = (function () {
  try { return new URLSearchParams(location.search).get("lang") === "zh" ? "zh" : "en"; } catch (e) { return "en"; }
})();
const T = COPY[LANG];
