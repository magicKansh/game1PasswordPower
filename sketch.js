// Password Power: Lockdown League game 1 (strong passwords + password managers)
// Flow from the storyboard: help desk -> client picks a password -> client leaves
// -> after all 3, open the report -> Crackjaw reacts -> The End.

const C = {
  night: "#140f2e", night2: "#211a4a", night3: "#2e2566",
  cream: "#fff4dc", muted: "#b8afdc",
  violet: "#9b6bff", sun: "#ffcf3d", aqua: "#33e1e8", pink: "#ff4f9a", lime: "#8ee05a",
};
const PIXEL = "Silkscreen";
const BODY = "Chakra Petch";
const MONO = "monospace"; // passwords need 0 vs O to be easy to tell apart

const POINTS = { Weak: 0, Moderate: 1, Strong: 2 };
const RATING_COLOR = { Weak: C.pink, Moderate: C.sun, Strong: C.lime };

const CLIENTS = [
  {
    name: "Maya", hair: "#c96d3a", shirt: C.pink,
    problem: "I need a new password for my email. My dog is Biscuit and I was born in 2009. Which one should I use?",
    options: [
      { pw: "Biscuit2009!", rating: "Weak", why: "Pet names and birth years are easy to find on social media, so attackers try them first." },
      { pw: "Tr0ub4dor&3", rating: "Moderate", why: "Looks tricky, but it's only 11 characters, and swapping letters for numbers is a trick cracking tools already know." },
      { pw: "copper-violin-mango-tundra", rating: "Strong", why: "26 characters of random, unrelated words. Long and random beats short and clever." },
    ],
  },
  {
    name: "Dev", hair: "#6b3e26", shirt: C.aqua,
    problem: "I use the same password for everything so I never forget it. Now I need one for my bank account. Which one?",
    options: [
      { pw: "D3v_Gamer#1", rating: "Weak", why: "Dev uses this everywhere. If one site gets breached, attackers try it on every other site. That's called credential stuffing." },
      { pw: "D3v_Gamer#1_Bank", rating: "Moderate", why: "Longer, but it's the old password with a tag on the end. Attackers try simple tweaks of leaked passwords first." },
      { pw: "q7#Vt2!mZx9$Lp4w", rating: "Strong", why: "16 random characters from a password manager, used only for the bank. Dev never has to memorize it." },
    ],
  },
  {
    name: "Rosa", hair: "#e8d27a", shirt: C.sun,
    problem: "I just got a password manager! It needs one master password that unlocks all my other passwords. Which one?",
    options: [
      { pw: "Rosa123", rating: "Weak", why: "Short, and it has her name in it. This password guards every other password Rosa has, so it must be her strongest." },
      { pw: "Sunflower!2026", rating: "Moderate", why: "14 characters is decent, but a dictionary word plus the year is a pattern attackers try early." },
      { pw: "marble-tiger-kettle-orbit-lantern", rating: "Strong", why: "Five random words: 33 characters and easy to remember. Perfect for the one password she memorizes. Add MFA too." },
    ],
  },
];

const TIPS = [
  "Long: 16 or more characters. Every extra character multiplies the guesses an attacker needs.",
  "Random: unrelated words or random characters. No names, pets, birthdays or teams.",
  "Unique: a different password for every account, so one leak doesn't unlock the rest.",
  "Managed: a password manager creates, stores and fills them in. You only remember one master password.",
];
const FACTS = [
  "8 random lowercase letters: about 209 billion combinations. 16 letters: about 44 sextillion.",
  "81% of hacking-related breaches used stolen or weak passwords (Verizon Data Breach Report, 2017).",
];

// ---------- Pixel sprites (same style as the Lockdown League website) ----------
const PALETTE = { k: C.night, w: C.cream, u: C.violet, y: C.sun, c: C.aqua, p: C.pink, a: "#a9a3c9", d: "#4a5fc1" };

const HERO = [
  "...kkkkkk...",
  "..kxxxxxxk..",
  ".kxxxxxxxxk.",
  ".kkkkkkkkkk.",
  ".kkwkkkkwkk.",
  ".kwwwwwwwwk.",
  ".kwkwwwwkwk.",
  ".kwwkkkkwwk.",
  "..kwwwwwwk..",
  "...kkkkkk...",
  "..kxxyyxxk..",
  ".kxxxxxxxxk.",
];
const CLIENT = [
  "...hhhh...",
  "..hhhhhh..",
  ".hhwwwwhh.",
  ".hwkwwkwh.",
  "..wwwwww..",
  "..wwkkww..",
  "...wwww...",
  "..ssssss..",
  ".ssssssss.",
  ".ssssssss.",
  ".wssssssw.",
  "..ssssss..",
  "..dd..dd..",
  "..dd..dd..",
  "..dd..dd..",
  ".aaa..aaa.",
];
const CRACKJAW = [
  "....kkkk....",
  "..kkuuuukk..",
  ".kuuuuuuuuk.",
  "kuuukkkkuuuk",
  "kuukkkkkkuuk",
  "kukkckkckkuk",
  "", "", // mouth rows, filled in by crackjaw(mood)
  "kuukkkkkkuuk",
  "kuuuuuuuuuuk",
  "kuuuyuuyuuuk",
  ".kkkkkkkkkk.",
];
const MOUTHS = {
  happy: ["kukpkkkkpkuk", "kukkppppkkuk"],
  meh: ["kukkkkkkkkuk", "kukkppppkkuk"],
  sad: ["kukkppppkkuk", "kukpkkkkpkuk"],
};
const BUILDINGS = [90, 150, 70, 190, 120, 80, 165, 110, 135, 60, 140, 95];

let scene = "title"; // title, office, choice, walking, report, ending
let clients = [];
let current = null;  // the client being helped right now
let walkT = 0;       // 0 to 1: how far the client has walked to the door
let spots = [];      // clickable areas, rebuilt every frame

function setup() {
  createCanvas(960, 600);
  document.fonts.load(`16px ${PIXEL}`);
  document.fonts.load(`16px "${BODY}"`);
}

function draw() {
  spots = [];
  if (scene === "title") drawTitle();
  else if (scene === "report") drawReport();
  else if (scene === "ending") drawEnding();
  else drawOffice();
  if (scene === "choice") drawChoice();
  cursor(spots.some(over) ? HAND : ARROW);
}

function mousePressed() {
  const spot = spots.find(over);
  if (spot) spot.onClick();
}

function keyPressed() {
  if (scene === "choice" && "123".includes(key)) pick(current.shown[Number(key) - 1]);
}

function newGame() {
  clients = CLIENTS.map((c, i) => ({ ...c, x: 430 + i * 140, shown: shuffle(c.options), picked: null, gone: false }));
  current = null;
  scene = "office";
}

function pick(option) {
  current.picked = option;
  walkT = 0;
  scene = "walking";
}

function score() {
  return clients.reduce((sum, c) => sum + POINTS[c.picked.rating], 0);
}

// ---------- Scenes ----------

function drawTitle() {
  background(C.night);
  drawSkyline();
  brand();
  bigTitle("Password", 60, 70, 64);
  bigTitle("Power", 60, 144, 64);

  fill(C.cream); textFont(BODY); textSize(19); textAlign(LEFT, TOP);
  para("You're a cybersecurity hero at the help desk. Three clients need passwords for their accounts. Pick the best one for each. Nobody tells you if you got it right until the end, and Crackjaw is watching.", 60, 240, 470, 28);
  button("Start", 60, 376, 180, 56, newGame);

  bubble("Go ahead, pick a password. I'll wait.", 600, 230, 300);
  drawSprite(crackjaw("happy"), 618, 345 - bob(), 10);
}

function drawOffice() {
  background(C.night2);
  noStroke(); fill(C.night); rect(0, 470, width, 130);
  fill(C.violet); rect(0, 470, width, 4);
  brand();

  // help desk with the hero behind it
  stroke(C.pink); strokeWeight(3); fill(C.night); rect(60, 150, 220, 44);
  noStroke(); fill(C.pink); textFont(PIXEL); textSize(16); textAlign(CENTER, CENTER);
  text("Hero help desk", 170, 172);
  drawSprite(HERO, 122, 282, 8, { x: C.violet });
  fill(C.night3); rect(50, 372, 240, 98);
  fill(C.violet); rect(50, 364, 240, 10);
  fill(PALETTE.a); rect(222, 322, 60, 42);
  fill(C.night); rect(245, 336, 14, 14);

  // exit door
  fill(C.night3); stroke(C.cream); strokeWeight(3); rect(850, 280, 80, 190);
  noStroke(); fill(C.sun); rect(862, 372, 8, 8);
  fill(C.aqua); textFont(PIXEL); textSize(14); textAlign(CENTER, BOTTOM); text("Exit", 890, 272);

  if (scene === "walking") {
    walkT += 1 / 90;
    if (walkT >= 1) { current.gone = true; current = null; scene = "office"; }
  }

  for (const c of clients) {
    if (c.gone) continue;
    const walking = scene === "walking" && c === current;
    const x = walking ? lerp(c.x, 870, walkT) : c.x;
    const box = { x: x - 10, y: 350, w: 80, h: 130, onClick: () => { current = c; scene = "choice"; } };
    const hot = scene === "office" && over(box);
    drawSprite(CLIENT, x, hot ? 368 : 374, 6, { h: c.hair, s: c.shirt });
    noStroke(); textFont(BODY); textSize(16); textAlign(CENTER, TOP);
    if (!walking) { fill(C.cream); text(c.name, x + 30, 482); }
    if (hot) { fill(C.sun); triangle(x + 18, 336, x + 42, 336, x + 30, 352); }
    if (walking) bubble("Thanks!", x - 20, 316, 100, 42);
    if (scene === "office") spots.push(box);
  }

  // instructions at the top
  fill(C.cream); noStroke(); textFont(BODY); textSize(20); textAlign(LEFT, TOP);
  const waiting = clients.filter(c => !c.gone).length;
  if (scene === "walking") {
    para(`${current.name} heads out the door. Was that the best pick? You'll find out in the report.`, 340, 100, 560, 28);
  } else if (waiting === 0) {
    text("Everyone's been helped. Time to check how you did.", 340, 100);
    button("Open report", 340, 150, 220, 56, () => { scene = "report"; });
  } else {
    text("Click a client to help them pick a password.", 340, 100);
    fill(C.muted); textSize(17); text(`${waiting} of 3 clients waiting`, 340, 132);
  }
}

function drawChoice() {
  const c = current;
  noStroke(); fill(20, 15, 46, 220); rect(0, 0, width, height);
  stroke(C.violet); strokeWeight(4); fill(C.night2); rect(60, 50, 840, 500);

  drawSprite(CLIENT, 105, 180, 10, { h: c.hair, s: c.shirt });
  noStroke(); fill(C.cream); textFont(PIXEL); textSize(18); textAlign(CENTER, TOP);
  text(c.name, 155, 350);

  fill(C.cream); rect(250, 86, 610, 176); triangle(250, 190, 250, 230, 222, 215);
  fill(C.night); textAlign(LEFT, TOP); textSize(22); text("Help me!", 274, 106);
  textFont(BODY); textSize(18); para(c.problem, 274, 144, 562, 26);

  fill(C.muted); textSize(16);
  text(`Pick the password you'd give ${c.name}. (Or press 1, 2 or 3.)`, 250, 280);
  c.shown.forEach((opt, i) => passwordButton(opt, i + 1, 250, 314 + i * 72, 610, 56));
}

function drawReport() {
  background(C.night);
  noStroke(); fill(C.violet); rect(36, 32, 888, 476);
  fill(C.cream); rect(48, 40, 424, 460); rect(488, 40, 424, 460);
  fill(C.night); textAlign(LEFT, TOP);

  // left page: the rules + facts
  textFont(PIXEL); textSize(26); text("Hero report", 72, 62);
  textFont(BODY); textSize(17); text(`You helped 3 clients. Score: ${score()} / 6`, 72, 100);
  let y = 136;
  textFont(PIXEL); textSize(14); text("A strong password is", 72, y); y += 24;
  textFont(BODY); textSize(14);
  for (const tip of TIPS) y = para(tip, 72, y, 376, 19) + 5;
  textFont(PIXEL); textSize(14); text("Did you know?", 72, y + 6); y += 30;
  textFont(BODY); textSize(14);
  for (const fact of FACTS) y = para(fact, 72, y, 376, 19) + 5;

  // right page: how each client did
  textFont(PIXEL); textSize(18); text("Your clients", 512, 62);
  clients.forEach((c, i) => {
    let y = 94 + i * 136;
    const r = c.picked.rating;
    fill(C.night); textFont(PIXEL); textSize(16); text(c.name, 512, y);
    fill(RATING_COLOR[r]); rect(780, y - 4, 108, 24);
    fill(C.night); textSize(13); textAlign(CENTER, TOP); text(r, 834, y);
    textAlign(LEFT, TOP); textFont(MONO); textSize(14); text(c.picked.pw, 512, y + 26);
    textFont(BODY); textSize(14); y = para(c.picked.why, 512, y + 48, 376, 18);
    if (r !== "Strong") {
      const best = c.options.find(o => o.rating === "Strong");
      textStyle(BOLD); para(`Stronger pick: ${best.pw}`, 512, y, 376, 18); textStyle(NORMAL);
    }
  });

  button("Face the villain", 360, 528, 240, 52, () => {
    if (score() >= 5) {
      try { localStorage.setItem("lockdown-thwarted-passwords", "1"); } catch (e) {}
    }
    scene = "ending";
  });
}

function drawEnding() {
  background(C.night);
  drawSkyline(0.45);
  brand();
  const s = score();
  const mood = s >= 5 ? "sad" : s >= 3 ? "meh" : "happy";

  stroke(C.violet); strokeWeight(4); fill(C.night2); rect(350, 70, 260, 260);
  noStroke(); fill(C.violet); rect(420, 54, 120, 30);
  fill(C.night); textFont(PIXEL); textSize(16); textAlign(CENTER, CENTER); text("Villain", 480, 69);
  drawSprite(crackjaw(mood), 408, 120 - bob(), 12);
  fill(C.sun); rect(400, 306, 160, 40);
  fill(C.night); textSize(18); text("The End", 480, 326);

  const weak = clients.find(c => c.picked.rating === "Weak");
  const lines = {
    sad: ["Long, random AND unique? I can't crack any of these!", "Crackjaw is thwarted!", C.lime],
    meh: ["Not bad, hero. A few of those slowed me down. I'll be back.", "Crackjaw got stuck, but not every time.", C.sun],
    happy: [`"${weak ? weak.picked.pw : "password"}"? Thanks, hero. That was too easy.`, "Crackjaw got in.", C.pink],
  }[mood];

  fill(C.cream); textFont(BODY); textSize(22); textAlign(CENTER, TOP); text(lines[0], 480, 370);
  fill(lines[2]); textFont(PIXEL); textSize(20); text(lines[1], 480, 410);
  fill(C.muted); textFont(BODY); textSize(17); text(`Your score: ${s} / 6`, 480, 444);

  button("Play again", 250, 490, 210, 56, newGame);
  button("All games", 500, 490, 210, 56, () => { window.location.href = "../../index.html"; });
}

// ---------- Drawing helpers ----------

function drawSprite(grid, x, y, px, extra = {}) {
  const colors = { ...PALETTE, ...extra };
  noStroke();
  grid.forEach((row, r) => [...row].forEach((ch, col) => {
    if (colors[ch]) { fill(colors[ch]); rect(x + col * px, y + r * px, px, px); }
  }));
}

function crackjaw(mood) {
  return [...CRACKJAW.slice(0, 6), ...MOUTHS[mood], ...CRACKJAW.slice(8)];
}

function bob() {
  return floor(frameCount / 30) % 2 * 6; // choppy two-frame hop, like the website
}

function drawSkyline(scale = 1) {
  const w = width / BUILDINGS.length;
  noStroke();
  BUILDINGS.forEach((fullH, i) => {
    const h = fullH * scale;
    fill(i % 3 === 0 ? C.night3 : C.night2);
    rect(i * w, height - h, w - 4, h);
    for (let wy = height - h + 14; wy < height - 10; wy += 22) {
      for (let wx = i * w + 10; wx < i * w + w - 14; wx += 18) {
        if ((wx + wy + i) % 3 === 0) { fill((wx / 2 + i) % 2 ? C.sun : C.aqua); rect(wx, wy, 5, 6); }
      }
    }
  });
}

function brand() {
  noStroke(); fill(C.muted); textFont(PIXEL); textSize(14); textAlign(LEFT, TOP);
  text("Lockdown League: game 1", 24, 20);
}

function bigTitle(str, x, y, size) {
  textFont(PIXEL); textStyle(BOLD); textSize(size); textAlign(LEFT, TOP); noStroke();
  const o = size * 0.06;
  fill(C.violet); text(str, x + 2 * o, y + 2 * o);
  fill(C.pink); text(str, x + o, y + o);
  fill(C.cream); text(str, x, y);
  textStyle(NORMAL);
}

function bubble(str, x, y, w, h = 64) {
  textFont(BODY); textSize(17);
  noStroke(); fill(C.cream); rect(x, y, w, h);
  triangle(x + w / 2 - 10, y + h, x + w / 2 + 10, y + h, x + w / 2, y + h + 16);
  fill(C.night); textAlign(LEFT, TOP); para(str, x + 14, y + 10, w - 28, 22);
}

function button(label, x, y, w, h, onClick) {
  const down = over({ x, y, w, h }) && mouseIsPressed ? 3 : 0;
  noStroke(); fill(C.pink); rect(x + 5, y + 5, w, h);
  stroke(C.cream); strokeWeight(3); fill(C.sun); rect(x + down, y + down, w, h);
  noStroke(); fill(C.night); textFont(PIXEL); textSize(17); textAlign(CENTER, CENTER);
  text(label, x + down + w / 2, y + down + h / 2);
  spots.push({ x, y, w, h, onClick });
}

function passwordButton(opt, n, x, y, w, h) {
  const hot = over({ x, y, w, h });
  stroke(hot ? C.aqua : C.night3); strokeWeight(3); fill(hot ? C.night3 : C.night); rect(x, y, w, h);
  noStroke(); fill(C.muted); textFont(PIXEL); textSize(16); textAlign(LEFT, CENTER); text(n, x + 18, y + h / 2);
  fill(C.cream); textFont(MONO); textSize(22); text(opt.pw, x + 52, y + h / 2);
  spots.push({ x, y, w, h, onClick: () => pick(opt) });
}

// Draws word-wrapped text and returns the y just below it.
function para(str, x, y, w, leading) {
  let line = "";
  for (const word of str.split(" ")) {
    const test = line ? line + " " + word : word;
    if (line && textWidth(test) > w) { text(line, x, y); y += leading; line = word; }
    else line = test;
  }
  text(line, x, y);
  return y + leading;
}

function over(s) {
  return mouseX > s.x && mouseX < s.x + s.w && mouseY > s.y && mouseY < s.y + s.h;
}
