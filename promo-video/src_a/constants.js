// Tipmi launch film — variant a. Every on-screen claim is a blankable constant here.
// Blanking a constant never re-times a shot (the timeline only reads CUES).
const BRAND_NAME = "Tipmi";
const TAGLINE = "Chosen, not ranked.";
const CTA = "Now open for creators.";            // alt: "Request an invite."
const CTA_ALT = "Request an invite.";
const HERO_MAKER = "Mara Lindqvist", HERO_TITLE = "Still life, 03";
const SUPPORTER = "Noor Haddad";                  // "" hides the ledger line
const EDITION = "1 of 25";                        // "" hides "Print sold"
const CHOSEN_COUNT = "31";                        // top bar "Today — 31 chosen"
const ACCENT = "#7A2E35";
const SEED = 20261001;

const LANG = (typeof location !== "undefined" && /[?&]lang=zh\b/.test(location.search)) ? "zh" : "en";

// Display lines L1..L9, wordmark W, L10 (tagline), L11 (CTA). "\n" = forced line break.
const COPY = {
  en: {
    L1: "Hours to make.",
    L2: "Seconds to vanish.",
    L3: "Not anymore.",
    L4: "Only the work\nworth seeing.",
    L5: "Chosen by hand.",
    L6: "No filler. No noise.",
    L7: "Make it here.",
    L8: "Your work. Your terms.",
    L9: "For people\nwho make things.",
    W: BRAND_NAME,
    L10: TAGLINE,
    L11: CTA,
    // UI strings (set dressing, not counted as lines)
    today: "Today — " + CHOSEN_COUNT + " chosen",
    time: "10:08",
    hero: HERO_MAKER + " — " + HERO_TITLE,
    studio: BRAND_NAME + " · Studio",
    warmth: "WARMTH", exposure: "EXPOSURE", grain: "GRAIN", crop: "CROP", publish: "PUBLISH",
    supporter: SUPPORTER ? "Supporter joined — " + SUPPORTER : "",
    tip: "Tip received",
    print: EDITION ? "Print sold — " + EDITION : "",
    published: "Published today",
  },
  zh: {
    L1: "做了几小时。",
    L2: "几秒就淹没。",
    L3: "到此为止。",
    L4: "只看值得看的。",
    L5: "亲手挑选。",
    L6: "不凑数，不喧哗。",
    L7: "在这里创作。",
    L8: "你的作品，你定。",
    L9: "献给创作的人。",
    W: BRAND_NAME,
    L10: "被选中，不被排序。",
    L11: "现向创作者开放。",
    today: "今日 — 精选 " + CHOSEN_COUNT,
    time: "10:08",
    hero: HERO_MAKER + " — " + HERO_TITLE,
    studio: BRAND_NAME + " · 工作室",
    warmth: "色温", exposure: "曝光", grain: "颗粒", crop: "裁切", publish: "发布",
    supporter: SUPPORTER ? "新支持者 — " + SUPPORTER : "",
    tip: "收到打赏",
    print: EDITION ? "版画售出 — " + EDITION : "",
    published: "今日发布",
  },
};
const T = COPY[LANG];

// Seeded caption list for the 24-plate library (plate 0 = hero). Never lorem ipsum.
const MAKERS = [
  [HERO_MAKER, HERO_TITLE],
  ["Jun Park", "Clay, studies"],
  ["Ana Sousa", "Harbour, 5"],
  ["Mei Lin", "Ochre field"],
  ["Sami Okafor", "Kiln, evening"],
  ["Vera Lund", "Linen, 11"],
  ["Elin Sato", "Dusk, 02"],
  ["Zara Quinn", "Interior, 9"],
  ["Noor Haddad", "Lido, 7 am"],
  ["Ada Hart", "Second light"],
  ["Oren Baptiste", "Field notes"],
  ["Ilya Petrov", "Night print"],
  ["Lia Moreau", "Paper, folded"],
  ["Kofi Mensah", "Grain study"],
  ["Ravi Menon", "Salt roads"],
  ["Maja Novak", "Low water"],
  ["Teo Adeyemi", "North light"],
  ["Tomas Reyes", "Tide, no. 7"],
  ["Hana Ito", "Quiet hours"],
  ["Jonah Keel", "Tidal, no. 4"],
  ["Ines Ferrer", "Letterforms, II"],
  ["Aya Toda", "Mass & void"],
  ["Felix Moreno", "Plan, east"],
  ["Lucas Brandt", "Arcade, 3"],
];

if (typeof module !== "undefined") module.exports = { BRAND_NAME, TAGLINE, CTA, COPY, SEED, MAKERS };
