const TOP_Y0 = 182;   // top of the room view on screen
// ---------- Game data: chefs, townspeople, menu, days ----------
const NONNA_LOOK = { skin: '#f1c9a5', hair: '#dedede', hairStyle: 'bun', old: true, glasses: true, shirt: '#b8322a', longSleeve: true, apron: '#fbf3e0', pants: '#3a2f2a', shoes: '#5b351b' };

const CHEFS = [
  { id: 'luca', first: 'Luca', last: 'Linguini', vibe: 'Goofy, lovable', quote: 'I once boiled water so well it got applause.', greet: 'Ciao ciao! What are we cooking today?',
    look: { skin: '#e0a878', hair: '#5a3417', hairStyle: 'messy', hat: 'capBack', hatColor: '#232428', shirt: '#fbfbf7', apron: '#1d5e36', pants: '#26262a', shoes: '#fbfbf7' } },
  { id: 'bella', first: 'Bella', last: 'Bolognese', vibe: 'Stylish, confident', quote: 'Every plate is a runway.', greet: 'Welcome to Noodle Rush, darling. What will it be?',
    look: { skin: '#b77b55', hair: '#2a1a12', hairStyle: 'long', necklace: true, shirt: '#c9372c', apron: '#1d5e36', pants: '#26262a', shoes: '#fbfbf7' } },
  { id: 'enzo', first: 'Enzo', last: 'Romano', vibe: 'Cool, competitive', quote: 'Fastest ladle in town. Try me.', greet: 'Order up. You will have it before you blink.',
    look: { skin: '#f0c39b', hair: '#4a2a14', hairStyle: 'spiky', sunglasses: true, shirt: '#2a2a2e', apron: '#232428', pants: '#26262a', shoes: '#fbfbf7' } },
  { id: 'sofia', first: 'Sofia', last: 'Sorrentina', vibe: 'Sweet, creative', quote: 'I like to hide little hearts in the sauce.', greet: 'Hi! Welcome in! What can I make for you?',
    look: { skin: '#f3d2b8', hair: '#e8b640', hairStyle: 'bun', hat: 'visor', hatColor: '#fbfbf7', shirt: '#f2c23a', apron: '#1d5e36', pants: '#26262a', shoes: '#fbfbf7' } },
  { id: 'marco', first: 'Marco', last: 'Mozzarella', vibe: 'Big, friendly', quote: 'Come in, come in! There is always room for one more.', greet: 'Benvenuti, my friend! What can I get you?',
    look: { skin: '#e0a878', hair: '#2a1a12', hairStyle: 'short', build: 'big', mustache: '#2a1a12', hat: 'toque', chefCoat: true, scarf: '#d9432f', pants: '#26262a', shoes: '#2a2a2e' } },
  { id: 'gianna', first: 'Gianna', last: 'Gnocchi', vibe: 'Bubbly, playful', quote: 'Gnocchi is just pasta giving itself a hug!', greet: 'Ooh, a customer! Hi hi! What would you like?',
    look: { skin: '#7a4a2e', hair: '#1f140e', hairStyle: 'curly', hat: 'beanie', hatColor: '#232428', shirt: '#2a2a2e', apron: '#232428', pants: '#26262a', shoes: '#fbfbf7' } },
  { id: 'mila', first: 'Mila', last: 'Moretti', vibe: 'Modern, fashionable', quote: 'Pasta, but make it aesthetic.', greet: 'Hey! Love the outfit. What are we having?',
    look: { skin: '#d9a27a', hair: '#2a1a12', hairStyle: 'ponytail', glasses: true, shirt: '#c9372c', pants: '#26262a', shoes: '#fbfbf7' } },
  { id: 'frankie', first: 'Frankie', last: 'Fusilli', vibe: 'Laid-back, funny', quote: 'Relax. The pasta can smell fear.', greet: 'Hey hey, welcome in. No rush. Well, a little rush.',
    look: { skin: '#c98e65', hair: '#2a1a12', hairStyle: 'short', hat: 'cap', hatColor: '#1d5e36', hatLogo: '#f6c453', headphones: true, shirt: '#fbfbf7', apron: '#1d5e36', pants: '#5b7fa3', shoes: '#fbfbf7' } },
];

// `ch` is the chapter of Nonna's journey a dish belongs to ('base' dishes are always on the menu);
// `unlock` is the day it joins the menu. Each chapter's dishes are featured while that chapter runs.
const SHAPES = [
  { id: 'spaghetti', name: 'Spaghetti', ch: 'base', unlock: 1 },
  { id: 'penne', name: 'Penne', ch: 'base', unlock: 1 },
  { id: 'farfalle', name: 'Farfalle', ch: 'base', unlock: 1 },
  { id: 'pappardelle', name: 'Pappardelle', ch: 'borgo', unlock: 3 },
  { id: 'ravioli', name: 'Ravioli', ch: 'borgo', unlock: 5, filled: true },
  { id: 'pici', name: 'Pici', ch: 'borgo', unlock: 7 },
  { id: 'tagliatelle', name: 'Tagliatelle', ch: 'bologna', unlock: 13 },
  { id: 'tortellini', name: 'Tortellini', ch: 'bologna', unlock: 15, filled: true },
  { id: 'trofie', name: 'Trofie', ch: 'genoa', unlock: 21 },
  { id: 'bucatini', name: 'Bucatini', ch: 'rome', unlock: 29 },
  { id: 'fettuccine', name: 'Fettuccine', ch: 'rome', unlock: 33 },
  { id: 'paccheri', name: 'Paccheri', ch: 'naples', unlock: 37 },
  { id: 'gnocchi', name: 'Gnocchi', ch: 'naples', unlock: 41 },
  { id: 'busiate', name: 'Busiate', ch: 'sicily', unlock: 47 },
];
const SAUCES = [
  { id: 'marinara', name: 'Marinara', color: 0xc8341f, css: '#c8341f', ch: 'base', unlock: 1 },
  { id: 'alfredo', name: 'Alfredo', color: 0xf0dca6, css: '#f0dca6', ch: 'base', unlock: 1 },
  { id: 'pesto', name: 'Pesto', color: 0x5f9a2e, css: '#5f9a2e', ch: 'base', unlock: 1 },
  { id: 'aglione', name: 'Aglione', color: 0xd4482b, css: '#d4482b', ch: 'borgo', unlock: 9, speck: 0xf6ead0 },
  { id: 'ragu', name: 'Ragù', color: 0x8e3b1f, css: '#8e3b1f', ch: 'bologna', unlock: 13, speck: 0x5a2410 },
  { id: 'noci', name: 'Walnut', color: 0xdcc6a2, css: '#dcc6a2', ch: 'genoa', unlock: 23, speck: 0x8a5a2b },
  { id: 'amatriciana', name: 'Amatriciana', color: 0xc63d22, css: '#c63d22', ch: 'rome', unlock: 29, speck: 0xf3c2b0 },
  { id: 'carbonara', name: 'Carbonara', color: 0xf8ecc4, css: '#f8ecc4', ch: 'rome', unlock: 31, speck: 0x2b2b2b },
  { id: 'puttanesca', name: 'Puttanesca', color: 0xa83220, css: '#a83220', ch: 'naples', unlock: 39, speck: 0x2b2420 },
  { id: 'norma', name: 'Norma', color: 0xc73b25, css: '#c73b25', ch: 'sicily', unlock: 45, speck: 0x4b2350 },
  { id: 'trapanese', name: 'Trapanese', color: 0xe8864f, css: '#e8864f', ch: 'sicily', unlock: 49, speck: 0xf7ecd6 },
];
const TOPPINGS = [
  { id: 'parm', name: 'Parmesan', color: 0xfff1b8, edge: 0xc9b46a, ch: 'base' },
  { id: 'basil', name: 'Basil', color: 0x3f8f3a, edge: 0x24601f, ch: 'base' },
  { id: 'meatball', name: 'Meatball', color: 0x7a3b1d, edge: 0x4e230f, ch: 'base' },
  { id: 'mushroom', name: 'Mushroom', color: 0xc9a77c, edge: 0x8d6b44, ch: 'base' },
  { id: 'chili', name: 'Chili flakes', color: 0xe0391f, edge: 0x99210f, ch: 'base' },
  { id: 'pancetta', name: 'Pancetta', color: 0xe99a95, edge: 0xa8524c, ch: 'borgo', unlock: 10 },
  { id: 'prosciutto', name: 'Prosciutto', color: 0xec8f92, edge: 0xa94a50, ch: 'bologna', unlock: 17 },
  { id: 'greenbeans', name: 'Green beans', color: 0x5aa84a, edge: 0x2f6a25, ch: 'genoa', unlock: 25 },
  { id: 'guanciale', name: 'Guanciale', color: 0xf0b9a8, edge: 0xa8624c, ch: 'rome', unlock: 35 },
  { id: 'mozzarella', name: 'Mozzarella', color: 0xfbfaf3, edge: 0xc9c2ae, ch: 'naples', unlock: 43 },
  { id: 'ricotta', name: 'Ricotta salata', color: 0xf7f3e8, edge: 0xbfb69e, ch: 'sicily', unlock: 51 },
];
// Nonna's journey: each chapter runs from its start day; after the last chapter the menu tours Italy again, a week per region.
const LAST_DAY = 52;
const chapterAt = day => day > LAST_DAY ? CHAPTERS[Math.floor((day - LAST_DAY - 1) / 8) % CHAPTERS.length] : CHAPTERS.filter(c => c.start <= day).pop();
const unlockedAt = (list, day) => { const ch = chapterAt(day).id; return list.filter(x => (x.unlock || 1) <= day && ((x.ch || 'base') === 'base' || x.ch === ch)); };
const everUnlocked = (list, day) => list.filter(x => (x.unlock || 1) <= day);
const PATTERN_LABEL = { center: 'in the center', ring: 'around the edge', inner: 'in a little circle', scatter: 'scattered' };

// Townspeople: each has a favorite order they always get, so regulars feel familiar.
const TOWNSFOLK = {
  rosa: { name: 'Rosa Bellini', short: 'Rosa', bio: "Nonna's oldest friend", patience: 1.4,
    look: { skin: '#f1c9a5', hair: '#d4d4d4', hairStyle: 'bun', old: true, glasses: true, shirt: '#a98bd0', longSleeve: true, pants: '#5d4c7a', shoes: '#6b4a3a' },
    order: { shape: 'spaghetti', sauce: 'marinara', toppings: [{ id: 'parm', n: 1, pattern: 'center' }, { id: 'basil', n: 3, pattern: 'ring' }] },
    lines: { hello: 'Oh, look at this lovely little shop! Your Nonna has told me all about you.', order: 'I would like spaghetti with marinara, dear. Just like the old days.',
      great: 'Just like your Nonna used to make. Bellissimo!', good: 'Very nice, dear. A little practice and it will be perfect.', bad: 'Oh my. Well, everyone starts somewhere.', angry: 'I am sorry dear, I cannot wait any longer.' } },
  tony: { name: 'Tony Tortellini', short: 'Tony', bio: 'Mail carrier, always in a hurry', patience: 0.85,
    look: { skin: '#d9a27a', hair: '#1f140e', hairStyle: 'short', mustache: '#1f140e', hat: 'cap', hatColor: '#2f5ea8', hatLogo: '#fbf3e0', shirt: '#3d6fb8', pants: '#24345a', shoes: '#2a2a2e' },
    order: { shape: 'penne', sauce: 'pesto', toppings: [{ id: 'parm', n: 1, pattern: 'center' }, { id: 'chili', n: 3, pattern: 'scatter' }] },
    lines: { hello: 'Quick, quick! I have forty letters to deliver before two o clock!', order: 'Penne with pesto, and make it spicy. And fast!',
      great: 'Fast AND delicious? You just got yourself a regular.', good: 'Not bad at all! Gotta run!', bad: 'Took a while and it was just okay. Ciao!', angry: 'Mamma mia, I am late! I have to go!' } },
  lucia: { name: 'Lucia Lasagna', short: 'Lucia', bio: 'Art student with a sketchbook', patience: 1.15,
    look: { skin: '#a8714f', hair: '#3b2314', hairStyle: 'ponytail', hat: 'beret', hatColor: '#d9432f', shirt: '#f2c23a', pants: '#4f6f9a', shoes: '#fbfbf7' },
    order: { shape: 'farfalle', sauce: 'alfredo', toppings: [{ id: 'basil', n: 1, pattern: 'center' }, { id: 'mushroom', n: 4, pattern: 'ring' }] },
    lines: { hello: 'Hi! I love your sign out front. Did you paint it yourself?', order: 'Can I get the bowtie pasta with alfredo? Mushrooms make it so pretty.',
      great: 'It is so pretty I almost do not want to eat it!', good: 'Yummy! The plating could pop a little more though.', bad: 'Hmm. I think I will just sketch food for now.', angry: 'I have class soon. Maybe next time!' } },
  paolo: { name: 'Paolo Pomodoro', short: 'Paolo', bio: 'Builder with a huge appetite', patience: 1.0,
    look: { skin: '#e8b48f', hair: '#5a3417', hairStyle: 'short', beard: '#5a3417', build: 'big', hat: 'hardhat', hatColor: '#f2c23a', shirt: '#e8742c', pants: '#4f6f9a', shoes: '#6b4a3a' },
    order: { shape: 'spaghetti', sauce: 'marinara', toppings: [{ id: 'parm', n: 2, pattern: 'center' }, { id: 'meatball', n: 4, pattern: 'ring' }] },
    lines: { hello: 'Big day at the building site. I could eat a whole wheel of cheese!', order: 'Spaghetti and meatballs, chef. Pile them high!',
      great: 'Now THAT is a lunch! I will tell the whole crew.', good: 'That hit the spot. Grazie!', bad: 'I am still a little hungry, to be honest.', angry: 'My lunch break is over. Next time!' } },
  giulia: { name: 'Giulia Gelato', short: 'Giulia', bio: 'Food blogger, hard to impress', patience: 0.95,
    look: { skin: '#f3d2b8', hair: '#b5432a', hairStyle: 'long', sunglasses: true, shirt: '#e3638f', necklace: true, pants: '#26262a', shoes: '#2a2a2e' },
    order: { shape: 'penne', sauce: 'alfredo', toppings: [{ id: 'basil', n: 1, pattern: 'center' }, { id: 'mushroom', n: 2, pattern: 'inner' }, { id: 'chili', n: 4, pattern: 'ring' }] },
    lines: { hello: 'So this is the new place everyone is talking about. Impress me.', order: 'Penne alfredo. Mushrooms, chili, basil. Presentation matters.',
      great: 'Five stars. I am putting you on my blog tonight.', good: 'Solid. Not life changing, but solid.', bad: 'I expected more. Much more.', angry: 'The service here is far too slow.' } },
  bruno: { name: 'Bruno Basilico', short: 'Bruno', bio: 'Fisherman from the harbor', patience: 1.25,
    look: { skin: '#c98b62', hair: '#9a9a9a', hairStyle: 'short', beard: '#b8b8b8', hat: 'beanie', hatColor: '#24345a', shirt: '#fbfbf7', stripes: '#24345a', pants: '#3a3a40', shoes: '#2a2a2e' },
    order: { shape: 'spaghetti', sauce: 'pesto', toppings: [{ id: 'parm', n: 3, pattern: 'inner' }, { id: 'basil', n: 3, pattern: 'ring' }] },
    lines: { hello: 'Ahoy! The sea was calm today. Good day for pasta.', order: 'Spaghetti with pesto, extra basil. Reminds me of my mother.',
      great: 'Like a calm sea on a sunny day. Perfetto.', good: 'Good catch, chef. Good catch.', bad: 'Choppy waters on this one, chef.', angry: 'The tide waits for no one. Neither do I.' } },
  nina: { name: 'Nina Nocciola', short: 'Nina', bio: 'Seven years old, loves cheese', patience: 1.0, scale: 0.82,
    look: { skin: '#7a4a2e', hair: '#1f140e', hairStyle: 'braids', shirt: '#58b368', pants: '#e3638f', shoes: '#fbfbf7' },
    order: { shape: 'farfalle', sauce: 'alfredo', toppings: [{ id: 'parm', n: 5, pattern: 'scatter' }] },
    lines: { hello: 'Hi!! Do you have bowtie pasta? Bowtie is the best one.', order: 'Bowties with the white sauce. And cheese. LOTS of cheese!',
      great: 'This is the best day of my whole entire life!', good: 'Yummy! Can I come back tomorrow?', bad: 'It is okay. Not enough cheese though.', angry: 'I am bored. I am going home!' } },
  carlo: { name: 'Carlo Cannoli', short: 'Carlo', bio: 'The mayor of the town', patience: 1.1,
    look: { skin: '#f0c39b', hair: '#b8b8b8', hairStyle: 'short', mustache: '#d0d0d0', hat: 'tophat', hatColor: '#232428', shirt: '#3b3f4a', longSleeve: true, scarf: '#b8322a', pants: '#2a2c33', shoes: '#2a2a2e' },
    order: { shape: 'penne', sauce: 'marinara', toppings: [{ id: 'basil', n: 1, pattern: 'center' }, { id: 'mushroom', n: 3, pattern: 'inner' }, { id: 'meatball', n: 3, pattern: 'ring' }] },
    lines: { hello: 'Good day! As mayor, I like to welcome every new business in town.', order: 'Penne marinara with meatballs and mushrooms, if you please.',
      great: 'Splendid! I hereby declare this the best pasta in town.', good: 'A fine meal. The town is lucky to have you.', bad: 'Hmm. We shall see how you grow.', angry: 'I have a council meeting. I cannot wait.' } },
  sal: { name: 'Salvatore Spumoni', short: 'Sal', bio: 'Runs the espresso bar next door', patience: 0.9, breadLike: 0.6,
    look: { skin: '#e8b48f', hair: '#2a1a12', hairStyle: 'spiky', mustache: '#2a1a12', shirt: '#fbfbf7', longSleeve: true, scarf: '#1d5e36', apron: '#5b351b', pants: '#26262a', shoes: '#5b351b' },
    order: { shape: 'farfalle', sauce: 'pesto', toppings: [{ id: 'parm', n: 1, pattern: 'center' }, { id: 'chili', n: 3, pattern: 'inner' }] },
    lines: { hello: 'Ciao, neighbor! I smell fresh pasta from my espresso bar all morning.', order: 'Bowties with pesto, a little chili. Quick, the coffee is brewing!',
      great: 'Perfetto! Better than my espresso, and that is saying a lot.', good: 'Buono! Come by for a coffee on the house.', bad: 'Eh. My espresso machine cooks better.', angry: 'My customers need me. Arrivederci!' } },
  marta: { name: 'Marta Minestrone', short: 'Marta', bio: 'Teaches music at the school', patience: 1.2, breadLike: 0.5,
    look: { skin: '#c98e65', hair: '#5a3417', hairStyle: 'bun', glasses: true, shirt: '#7a9a5a', longSleeve: true, necklace: true, pants: '#5d4c7a', shoes: '#6b4a3a' },
    order: { shape: 'penne', sauce: 'marinara', toppings: [{ id: 'mushroom', n: 3, pattern: 'ring' }, { id: 'parm', n: 1, pattern: 'center' }] },
    lines: { hello: 'What a charming little place. It has a nice rhythm to it.', order: 'Penne marinara with mushrooms, please. In harmony, if you can!',
      great: 'A perfect symphony on a plate. Bravissimo!', good: 'Lovely. Just a few notes off.', bad: 'Hmm. That one was a bit out of tune.', angry: 'I have a rehearsal. I must go.' } },
  gino: { name: 'Gino Gnudi', short: 'Gino', bio: 'Teenage skateboarder, always hungry', patience: 0.85, breadLike: 0.8,
    look: { skin: '#a8714f', hair: '#1f140e', hairStyle: 'messy', hat: 'beanie', hatColor: '#e8742c', headphones: true, shirt: '#3d6fb8', pants: '#3a3a40', shoes: '#d9432f' },
    order: { shape: 'spaghetti', sauce: 'alfredo', toppings: [{ id: 'meatball', n: 3, pattern: 'inner' }, { id: 'chili', n: 4, pattern: 'ring' }] },
    lines: { hello: 'Yo! Is this the place with the hand-made noodles? Sick.', order: 'Spaghetti alfredo with meatballs. And spicy. Super spicy.',
      great: 'Bro. BRO. That is the best thing I have ever eaten.', good: 'Pretty rad. I would come back.', bad: 'Kinda mid, not gonna lie.', angry: 'This is taking forever. I am out.' } },
};

// The food critic: comes every few days, orders something different each time, and writes it up in the paper.
const CRITIC = {
  name: 'Vittoria Vespa', short: 'Vittoria', bio: 'Food critic for La Gazzetta', patience: 0.9, breadLike: 1, critic: true,
  look: { skin: '#f0c39b', hair: '#2a1a12', hairStyle: 'bun', sunglasses: true, hat: 'beret', hatColor: '#2a2a2e', shirt: '#c9a77c', longSleeve: true, scarf: '#b8322a', pants: '#2a2c33', shoes: '#2a2a2e' },
  lines: { hello: 'Vittoria Vespa, La Gazzetta di Borgo Fiore. Let us see what this kitchen can do.', order: '',
    great: 'Hmm. Hmm! Yes. I have much to write about.', good: 'Interesting. Very interesting.', bad: 'I see. I see.', angry: 'I have seen enough. Good day.' },
};
const PAPER = {
  5: { head: 'BEST PASTA IN BORGO FIORE!', body: 'Hand-made noodles, perfect sauce and plates pretty enough to frame. Run, do not walk, to Noodle Rush.', buzz: 3, days: 3 },
  4: { head: 'NEW PASTA SPOT IS A DELIGHT', body: 'Fresh pasta, warm service and real care on every plate. Noodle Rush is worth the trip.', buzz: 2, days: 3 },
  3: { head: 'NOODLE RUSH: GOOD, NOT GREAT', body: 'The pasta is fresh and the room is charming, but the kitchen still has a few kinks to work out.', buzz: 0, days: 0 },
  2: { head: 'NOODLE RUSH NEEDS PRACTICE', body: 'The idea is lovely. The plate was not. Our critic left hungry for something better.', buzz: -1, days: 2 },
  1: { head: 'SKIP THE NOODLES, SAYS CRITIC', body: 'A long wait and a disappointing plate. Noodle Rush has a long way to go.', buzz: -2, days: 2 },
};

const DAYS = {
  1: { title: 'Opening day', roster: [['rosa', 4], ['tony', 85], ['lucia', 170]],
       nonna: 'It is opening day! Only a few people know about us yet, so take your time and learn the kitchen.' },
  2: { title: 'Word is spreading', roster: [['rosa', 4], ['paolo', 60], ['tony', 125], ['giulia', 190]],
       nonna: 'Rosa told her friends about us. A few new faces today, and one of them writes about food!' },
  3: { title: 'A busy Wednesday', roster: [['lucia', 4], ['bruno', 50], ['nina', 100], ['paolo', 150], ['rosa', 200]],
       nonna: 'Busier today. Use both pots, and keep an eye on who is waiting the longest.' },
  4: { title: 'The mayor drops by', roster: [['tony', 4], ['giulia', 45], ['carlo', 90], ['nina', 135], ['bruno', 175], ['lucia', 215]],
       nonna: 'I hear the mayor himself is coming today. Make Nonna proud!' },
};
// How many customers the restaurant can handle in a day. Capacity upgrades raise it.
const BASE_CAP = 8;
function kitchenCap(up) { return BASE_CAP + UPGRADES.reduce((a, u) => a + (u.cap && up[u.id] ? u.cap : 0), 0); }
// how many people want to eat here on day n; the kitchen's capacity decides how many actually get in
const crowdDemand = n => 5 + Math.floor((n - 4) * 0.8);
function crowdFor(n, up) { return Math.min(kitchenCap(up || {}), crowdDemand(n)); }
function dayConfig(n, up) {
  if (DAYS[n]) return DAYS[n];
  up = up || (typeof SAVE !== 'undefined' ? SAVE.upgrades : {}) || {};
  const count = crowdFor(n, up), folk = Object.keys(TOWNSFOLK);
  const nv = Math.max(count - folk.length, n >= 6 ? 1 + (n % 2) : 0);
  const ids = Phaser.Utils.Array.Shuffle(folk.slice()).slice(0, count - Math.min(nv, count)).concat(Array.from({ length: Math.min(nv, count) }, (_, i) => 'v' + i));
  Phaser.Utils.Array.Shuffle(ids);
  const gap = Math.max(count >= 14 ? 24 : count >= 11 ? 28 : 32, 44 - (n - 4) * 2);
  return { title: ['Market day', 'Sunny piazza', 'Lunch rush', 'Festa in town', 'Rainy afternoon', 'Busy streets', 'Sagra della pasta'][n % 7], roster: ids.map((id, i) => [id, 4 + i * gap]), nonna: count > 9 ? 'Look at this crowd! Good thing we grew the kitchen.' : 'The whole town knows us now. Keep those plates coming!' };
}

// Visitors passing through town: generated people so a busy day never runs out of faces.
const VISITOR_NAMES = ['Hans', 'Yuki', 'Amara', 'Olivia', 'Pierre', 'Diego', 'Priya', 'Liam', 'Mei', 'Sven', 'Fatima', 'Noah', 'Ines', 'Kofi', 'Elena', 'Tomas'];
const VISITOR_BIOS = ['Tourist with a big camera', 'Cycling across Italy', 'Visiting their cousins', 'On a school trip', 'Here for the festa', 'Backpacker with a map'];
function visitorDef(key, seed) {
  const R = rng(seed);
  const pick = a => a[Math.floor(R() * a.length)];
  const skin = pick(['#f3d2b8', '#f0c39b', '#e0a878', '#c98e65', '#a8714f', '#7a4a2e', '#5a3622']);
  const hair = pick(['#1f140e', '#2a1a12', '#5a3417', '#8a4b22', '#b5432a', '#e8b640', '#d4d4d4']);
  const look = { skin, hair, hairStyle: pick(['short', 'messy', 'long', 'ponytail', 'curly', 'bun', 'spiky', 'braids']), shirt: pick(['#3d6fb8', '#58b368', '#e8742c', '#a98bd0', '#e3638f', '#f2c23a', '#2a2a2e', '#fbfbf7']),
    pants: pick(['#26262a', '#5b7fa3', '#7d4a26', '#4f6f9a', '#3a3a40']), shoes: pick(['#fbfbf7', '#2a2a2e', '#7d4a26']) };
  if (R() < 0.35) { look.hat = pick(['cap', 'beanie', 'visor', 'beret']); look.hatColor = pick(['#232428', '#d9432f', '#2f5ea8', '#fbfbf7', '#1d5e36']); }
  if (R() < 0.25) look[pick(['glasses', 'sunglasses'])] = true;
  const name = pick(VISITOR_NAMES);
  return { name, short: name, bio: pick(VISITOR_BIOS), patience: 0.9 + R() * 0.3, breadLike: 0.5, visitor: true, look,
    order: { shape: 'spaghetti', sauce: 'marinara', toppings: [{ id: 'parm', n: 1, pattern: 'center' }] },
    lines: { hello: pick(['Buongiorno! Is this the famous pasta place?', 'Hello! Everyone in the piazza said to come here.', 'Ciao! My guidebook says you make pasta by hand.']), order: '',
      great: pick(['Best meal of my whole trip!', 'I have to tell everyone back home about this!']), good: pick(['Very tasty, grazie!', 'Nice! I would come back.']),
      bad: pick(['Hmm, not quite what I hoped.', 'It was okay, I guess.']), angry: pick(['I have a train to catch. Arrivederci!', 'Too long, sorry. I will try another place.']) } };
}

// Helpers who join when you hire them.
const MATTEO_LOOK = { skin: '#e0a878', hair: '#2a1a12', hairStyle: 'messy', shirt: '#fbfbf7', apron: '#c9372c', pants: '#26262a', shoes: '#2a2a2e' };
const ROCCO_LOOK = { skin: '#c98e65', hair: '#1f140e', hairStyle: 'short', beard: '#1f140e', hat: 'toque', chefCoat: true, build: 'big', pants: '#3a3a40', shoes: '#2a2a2e' };
const COOK_WAGE = 5;
const BAKER_LOOK = { skin: '#d9a27a', hair: '#5a3417', hairStyle: 'bun', shirt: '#e8742c', longSleeve: true, scarf: '#1f6b3b', apron: '#fbf3e0', pants: '#5b351b', shoes: '#2a2a2e' };
const BAKER_WAGE = 4;


// ---------- Economy and shop ----------
const START_PANTRY = 8;
const FLOUR_BAG = { plates: 4, price: 2 };       // flour and eggs for four plates of dough
const RUSH_DELIVERY = { plates: 3, price: 4 };   // emergency mid-day delivery costs more
const BREAD_PRICE = 1.5;

// Tables: row 0 sits along the back wall, row 1 is closer to the front.
const TABLE_ROWS = [{ top: 474, seat: 524 }, { top: 560, seat: 610 }];
const DEFAULT_TABLES = [{ x: 1012, row: 0 }, { x: 1197, row: 0 }];
const EXTRA_TABLE = { x: 1100, row: 1 };
const EXTRA_TABLE_XS = [760, 420, 1100, 250, 600, 940, 1180];

// cap: extra customers per day the restaurant can handle once owned. req: needs that upgrade first.
const UPGRADES = [
  { id: 'garlic', group: 'kitchen', name: 'Garlic bread oven', price: 30, desc: 'Add garlic bread to the menu. Some customers order a slice on the side, and each one sells for 15 coins.' },
  { id: 'pot3', group: 'kitchen', name: 'Third pasta pot', price: 50, cap: 1, desc: 'Boil three plates of pasta at the same time.' },
  { id: 'fastpot', group: 'kitchen', name: 'Rolling-boil burners', price: 70, cap: 1, desc: 'Hotter burners. Pasta boils about 30% faster.' },
  { id: 'machine', group: 'kitchen', name: 'Electric pasta roller', price: 80, cap: 1, desc: 'Rolls the dough about 70% faster, so each plate takes fewer turns of the crank.' },
  { id: 'pot4', group: 'kitchen', name: 'Second stove', price: 110, cap: 1, req: 'pot3', desc: 'A fourth pot of boiling water for the busiest days.' },
  { id: 'cushions', group: 'room', name: 'Comfy cushions', price: 25, desc: 'Soft seat cushions. Seated customers wait 15% longer before giving up.' },
  { id: 'table3', group: 'room', name: 'Extra table', price: 60, cap: 2, desc: 'Two more seats near the front, so fewer customers stand around waiting.' },
  { id: 'table4', group: 'room', name: 'Fourth table', price: 110, cap: 2, req: 'table3', desc: 'Two more seats. Room for a real crowd.' },
  { id: 'flyers', group: 'room', name: 'Print flyers', price: 10, repeat: true, desc: 'Hand out flyers in the piazza. More customers come in over the next 2 days.' },
  { id: 'cook', group: 'staff', name: 'Hire Rocco, line cook', price: 90, cap: 2, wage: COOK_WAGE, desc: 'Rocco watches the pots and drains every pasta right when it is al dente. He earns 50 coins a day.' },
  { id: 'baker', group: 'staff', name: 'Hire Zia Pina, oven master', price: 120, cap: 1, req: 'garlic', wage: BAKER_WAGE, desc: 'Zia Pina slides every garlic bread into the oven with her pizza peel and pulls it out golden. She earns 40 coins a day.' },
  { id: 'register2', group: 'staff', name: 'Second register', price: 150, cap: 3, desc: 'Your cousin Matteo runs a second register. When someone waits at the counter, he takes their order for you.' },
];

// Chef wardrobe. Items with a price have to be bought once with tips.
const WARDROBE = [
  { key: 'skin', label: 'Skin', color: true, options: ['#f3d2b8', '#f0c39b', '#e0a878', '#c98e65', '#a8714f', '#7a4a2e', '#5a3622'].map(v => ({ v })) },
  { key: 'hairStyle', label: 'Hair', options: [{ v: 'short', name: 'Short' }, { v: 'messy', name: 'Messy' }, { v: 'spiky', name: 'Spiky' }, { v: 'long', name: 'Long' }, { v: 'ponytail', name: 'Ponytail' }, { v: 'bun', name: 'Bun' }, { v: 'curly', name: 'Curly' }, { v: 'braids', name: 'Braids' }, { v: 'none', name: 'Bald' }] },
  { key: 'hair', label: 'Hair color', color: true, options: [{ v: '#1f140e' }, { v: '#2a1a12' }, { v: '#5a3417' }, { v: '#8a4b22' }, { v: '#b5432a' }, { v: '#e8b640' }, { v: '#d4d4d4' }, { v: '#3d6fb8', price: 4 }, { v: '#e3638f', price: 4 }, { v: '#58b368', price: 4 }] },
  { key: 'hat', label: 'Hat', options: [{ v: null, name: 'No hat' }, { v: 'toque', name: 'Chef hat' }, { v: 'cap', name: 'Cap', price: 5 }, { v: 'capBack', name: 'Backwards cap', price: 5 }, { v: 'beanie', name: 'Beanie', price: 6 }, { v: 'visor', name: 'Visor', price: 6 }, { v: 'beret', name: 'Beret', price: 8 }, { v: 'hardhat', name: 'Hard hat', price: 10 }, { v: 'tophat', name: 'Top hat', price: 25 },
    { v: 'headscarf', name: 'Sfoglina scarf', price: 8, ch: 'bologna' }, { v: 'sailor', name: 'Sailor cap', price: 8, ch: 'genoa' }, { v: 'laurel', name: 'Laurel crown', price: 12, ch: 'rome' },
    { v: 'paglietta', name: 'Straw boater', price: 10, ch: 'naples' }, { v: 'coppola', name: 'Coppola', price: 10, ch: 'sicily' }] },
  { key: 'hatColor', label: 'Hat color', color: true, options: [{ v: '#232428' }, { v: '#fbfbf7' }, { v: '#1d5e36' }, { v: '#d9432f' }, { v: '#2f5ea8' }, { v: '#f2c23a', price: 3 }, { v: '#e3638f', price: 3 }, { v: '#7a4fb0', price: 3 }] },
  { key: 'shirt', label: 'Shirt', color: true, options: [{ v: '#fbfbf7' }, { v: '#2a2a2e' }, { v: '#c9372c' }, { v: '#3d6fb8' }, { v: '#f2c23a' }, { v: '#58b368' }, { v: '#e3638f', price: 3 }, { v: '#a98bd0', price: 3 }, { v: '#e8742c', price: 3 }] },
  { key: 'apron', label: 'Apron', color: true, options: [{ v: '#1d5e36' }, { v: '#232428' }, { v: null, name: 'None' }, { v: '#c9372c', price: 3 }, { v: '#2f5ea8', price: 3 }, { v: '#e3638f', price: 3 }, { v: '#f2c23a', price: 3 }, { v: '#fbf3e0', price: 3 }] },
  { key: 'pants', label: 'Pants', color: true, options: [{ v: '#26262a' }, { v: '#5b7fa3' }, { v: '#4f6f9a' }, { v: '#7d4a26' }, { v: '#3a3a40' }, { v: '#e3638f', price: 3 }, { v: '#1d5e36', price: 3 }] },
  { key: 'extras', label: 'Extras', toggles: [
    { k: 'glasses', name: 'Glasses', price: 4 }, { k: 'sunglasses', name: 'Sunglasses', price: 8 }, { k: 'mustache', name: 'Mustache', hairColored: true },
    { k: 'beard', name: 'Beard', hairColored: true }, { k: 'necklace', name: 'Gold chain', price: 10 }, { k: 'scarf', name: 'Scarf', price: 6, value: '#d9432f' },
    { k: 'headphones', name: 'Headphones', price: 12 }, { k: 'chefCoat', name: 'Chef coat', price: 15 }, { k: 'build', name: 'Big build', value: 'big' } ] },
];

// Renovations: three big goals that change how the restaurant looks and raise every tip.
const RENOVATIONS = [
  { tier: 1, name: 'Trattoria', price: 300, tip: 0.05, desc: 'A striped awning over the window and a bigger painted sign out front.' },
  { tier: 2, name: 'Ristorante', price: 700, tip: 0.10, desc: 'Oak ceiling beams and warm pendant lamps over every table.' },
  { tier: 3, name: 'Osteria Famosa', price: 1500, tip: 0.20, desc: 'Gold trim, a crystal chandelier and a plaque from La Gazzetta. Famous across Italy.' },
];
const restaurantName = r => ['Noodle Rush', 'Trattoria Noodle Rush', 'Ristorante Noodle Rush', 'Noodle Rush, Osteria Famosa'][r || 0];

// The piazza market: new stalls every morning. A boost lasts for one day only.
const BOOSTS = [
  { id: 'flowers', name: 'Fresh flowers', price: 4, desc: 'Flowers on every table. Customers wait 15% longer today.' },
  { id: 'musician', name: 'Street musician', price: 6, desc: 'An accordion player in the piazza draws 2 extra customers today.' },
  { id: 'oil', name: "Cousin Gianni's olive oil", price: 5, desc: 'Fresh olive oil on every table. Customers tip 10% more today.' },
];
const MUSICIAN_LOOK = { skin: '#e0a878', hair: '#2a1a12', hairStyle: 'short', mustache: '#2a1a12', hat: 'beret', hatColor: '#d9432f', shirt: '#fbfbf7', stripes: '#2f5ea8', scarf: '#d9432f', pants: '#26262a', shoes: '#2a2a2e' };
const FLOUR_DEAL = { bags: 3, price: 5 };
const SALE_OFF = 0.25;

// Decorations: wall pieces hang on the wall, floor pieces stand on the floor. Drag them anywhere in Rearrange.
const DECOR = [
  { id: 'pisa', name: 'Leaning Tower painting', price: 0, kind: 'wall', starter: true },
  { id: 'nonna', name: "Nonna's portrait", price: 0, kind: 'wall', starter: true },
  { id: 'plant', name: 'Potted plant', price: 0, kind: 'floor', starter: true },
  { id: 'flag', name: 'Italian flag', price: 6, kind: 'wall' },
  { id: 'clock', name: 'Wall clock', price: 9, kind: 'wall' },
  { id: 'vespa', name: 'Vespa poster', price: 10, kind: 'wall' },
  { id: 'mandolin', name: 'Mandolin', price: 14, kind: 'wall' },
  { id: 'colosseum', name: 'Colosseum painting', price: 18, kind: 'wall' },
  { id: 'fern', name: 'Big fern', price: 8, kind: 'floor' },
  { id: 'barrel', name: 'Wine barrel', price: 12, kind: 'floor' },
  { id: 'lemon', name: 'Lemon tree', price: 16, kind: 'floor' },
  { id: 'bust', name: 'Marble bust', price: 30, kind: 'floor' },
  { id: 'gelato', name: 'Gelato cart', price: 40, kind: 'floor' },
  // souvenirs: each city on Nonna's journey sells its own (ch: the chapter that unlocks them)
  { id: 'towers', name: 'Two Towers painting', price: 35, kind: 'wall', ch: 'bologna' },
  { id: 'parmigiano', name: 'Parmigiano wheels', price: 40, kind: 'floor', ch: 'bologna' },
  { id: 'lanterna', name: 'Lanterna lighthouse', price: 35, kind: 'wall', ch: 'genoa' },
  { id: 'basilbox', name: 'Basil planter', price: 30, kind: 'floor', ch: 'genoa' },
  { id: 'trevi', name: 'Trevi Fountain painting', price: 45, kind: 'wall', ch: 'rome' },
  { id: 'column', name: 'Roman column', price: 55, kind: 'floor', ch: 'rome' },
  { id: 'vesuvio', name: 'Vesuvius painting', price: 45, kind: 'wall', ch: 'naples' },
  { id: 'tomatocrate', name: 'San Marzano crate', price: 35, kind: 'floor', ch: 'naples' },
  { id: 'majolica', name: 'Caltagirone plate', price: 40, kind: 'wall', ch: 'sicily' },
  { id: 'cart', name: 'Sicilian painted cart', price: 80, kind: 'floor', ch: 'sicily' },
  // rare finds: only sold at the piazza market, on the days the antique dealer comes
  { id: 'accordion', name: 'Old accordion', price: 60, kind: 'wall', market: true },
  { id: 'trophy', name: 'Golden spoon trophy', price: 90, kind: 'floor', market: true },
  { id: 'fountain', name: 'Little fountain', price: 150, kind: 'floor', market: true },
];
const chapterStart = id => (CHAPTERS.find(c => c.id === id) || { start: 1 }).start;
const souvenirOpen = (def, day) => !def.ch || day >= chapterStart(def.ch);
const DEFAULT_DECOR = [{ id: 'pisa', x: 1004, y: TOP_Y0 + 124 }, { id: 'nonna', x: 1214, y: TOP_Y0 + 128 }, { id: 'plant', x: 268, y: TOP_Y0 + 334 }];
const ROOM_STYLES = {
  wall: [
    { id: 'cream', name: 'Cream stripes', price: 0, a: '#f3e2bf', b: '#ecd6ad', dot: 'rgba(184,50,42,0.18)' },
    { id: 'sage', name: 'Sage green', price: 20, a: '#dfe8cf', b: '#d0ddbb', dot: 'rgba(31,107,59,0.25)' },
    { id: 'terra', name: 'Terracotta', price: 20, a: '#efc7a3', b: '#e8b991', dot: 'rgba(125,74,38,0.22)' },
    { id: 'amalfi', name: 'Amalfi blue', price: 25, a: '#d9e8f3', b: '#c8dcec', dot: 'rgba(242,182,48,0.45)' },
    { id: 'bolognared', name: 'Bologna red', price: 30, ch: 'bologna', a: '#e9a68c', b: '#df967a', dot: 'rgba(125,40,20,0.25)' },
    { id: 'ochre', name: 'Roman ochre', price: 35, ch: 'rome', a: '#f1d08c', b: '#e7c274', dot: 'rgba(160,90,30,0.3)' },
  ],
  floor: [
    { id: 'terracotta', name: 'Terracotta tile', price: 0, a: '#c8714a', b: '#b9633e' },
    { id: 'check', name: 'Black and white', price: 20, a: '#efe9dc', b: '#3a3a40' },
    { id: 'wood', name: 'Wood planks', price: 20, a: '#a8683a', b: '#965a30', wood: true },
    { id: 'marble', name: 'Marble', price: 30, a: '#efeae2', b: '#ddd6cb', marble: true },
    { id: 'slate', name: 'Ligurian slate', price: 35, ch: 'genoa', a: '#7a858f', b: '#69747e' },
    { id: 'majolica', name: 'Sicilian majolica', price: 45, ch: 'sicily', a: '#f6efdc', b: '#2f6fb0', majolica: true },
  ],
  cloth: [
    { id: 'red', name: 'Red check', price: 0, c: '217,67,47' },
    { id: 'green', name: 'Green check', price: 10, c: '31,138,76' },
    { id: 'blue', name: 'Blue check', price: 10, c: '47,94,168' },
    { id: 'lemon', name: 'Amalfi lemon', price: 25, ch: 'naples', c: '232,180,30' },
  ],
};

// ---------- Nonna's recipe book ----------
// Chapter one happens in Borgo Fiore, a Tuscan hill town. Later chapters travel across Italy.
const CHAPTERS = [
  { id: 'borgo', name: 'Borgo Fiore', region: 'Tuscany', note: 'Pappardelle and pici', lon: 11.1, lat: 43.3, start: 1 },
  { id: 'bologna', name: 'Bologna', region: 'Emilia-Romagna', note: 'Ragù and tortellini', lon: 11.34, lat: 44.49, start: 13 },
  { id: 'genoa', name: 'Genoa', region: 'Liguria', note: 'Pesto and trofie', lon: 8.93, lat: 44.41, start: 21 },
  { id: 'rome', name: 'Rome', region: 'Lazio', note: 'Carbonara and amatriciana', lon: 12.5, lat: 41.9, start: 29 },
  { id: 'naples', name: 'Naples', region: 'Campania', note: 'Gnocchi and mozzarella', lon: 14.27, lat: 40.85, start: 37 },
  { id: 'sicily', name: 'Sicily', region: 'Sicily', note: 'Pasta alla Norma', lon: 15.0, lat: 37.5, start: 45 },
];
// What joins the menu on which day, and the rank you earn. `adds` are menu items.
const UNLOCKS = [
  { day: 1, ch: 'borgo', rank: 'Apprentice', what: 'Spaghetti, penne and farfalle', adds: [], recipe: 'dough' },
  { day: 3, ch: 'borgo', rank: 'Line cook', what: 'Pappardelle', adds: ['pappardelle'], recipe: 'pappardelle' },
  { day: 5, ch: 'borgo', rank: 'Pasta maker', what: 'Ravioli, filled by hand', adds: ['ravioli'], recipe: 'ravioli' },
  { day: 7, ch: 'borgo', rank: 'Pasta maker', what: 'Pici, rolled by hand', adds: ['pici'], recipe: 'pici' },
  { day: 9, ch: 'borgo', rank: 'Sous chef', what: 'Aglione garlic sauce', adds: ['aglione'], recipe: 'aglione' },
  { day: 10, ch: 'borgo', rank: 'Head chef', what: 'Crispy pancetta', adds: ['pancetta'], recipe: 'pancetta' },
  { day: 12, ch: 'borgo', rank: 'Maestro of Borgo Fiore', what: 'Chapter complete!', adds: [], recipe: 'pomarola' },
  { day: 13, ch: 'bologna', rank: 'Guest chef in Bologna', what: 'Tagliatelle and ragù', adds: ['tagliatelle', 'ragu'], recipe: 'ragu' },
  { day: 15, ch: 'bologna', rank: 'Guest chef in Bologna', what: 'Tortellini, filled by hand', adds: ['tortellini'], recipe: 'tortellini' },
  { day: 17, ch: 'bologna', rank: 'Guest chef in Bologna', what: 'Prosciutto di Parma', adds: ['prosciutto'], recipe: 'prosciutto' },
  { day: 20, ch: 'bologna', rank: 'Maestro of Bologna', what: 'Chapter complete!', adds: [], recipe: 'lasagne' },
  { day: 21, ch: 'genoa', rank: 'Guest chef in Genoa', what: 'Trofie and real pesto', adds: ['trofie'], recipe: 'pesto' },
  { day: 23, ch: 'genoa', rank: 'Guest chef in Genoa', what: 'Walnut sauce', adds: ['noci'], recipe: 'noci' },
  { day: 25, ch: 'genoa', rank: 'Guest chef in Genoa', what: 'Green beans', adds: ['greenbeans'], recipe: 'trofie' },
  { day: 28, ch: 'genoa', rank: 'Maestro of Genoa', what: 'Chapter complete!', adds: [], recipe: 'focaccia' },
  { day: 29, ch: 'rome', rank: 'Guest chef in Rome', what: 'Bucatini and amatriciana', adds: ['bucatini', 'amatriciana'], recipe: 'amatriciana' },
  { day: 31, ch: 'rome', rank: 'Guest chef in Rome', what: 'Carbonara', adds: ['carbonara'], recipe: 'carbonara' },
  { day: 33, ch: 'rome', rank: 'Guest chef in Rome', what: 'Fettuccine', adds: ['fettuccine'], recipe: 'alfredo' },
  { day: 35, ch: 'rome', rank: 'Guest chef in Rome', what: 'Guanciale', adds: ['guanciale'], recipe: 'gricia' },
  { day: 36, ch: 'rome', rank: 'Maestro of Rome', what: 'Chapter complete!', adds: [], recipe: 'cacio' },
  { day: 37, ch: 'naples', rank: 'Guest chef in Naples', what: 'Paccheri', adds: ['paccheri'], recipe: 'marinara' },
  { day: 39, ch: 'naples', rank: 'Guest chef in Naples', what: 'Puttanesca sauce', adds: ['puttanesca'], recipe: 'puttanesca' },
  { day: 41, ch: 'naples', rank: 'Guest chef in Naples', what: 'Potato gnocchi', adds: ['gnocchi'], recipe: 'gnocchi' },
  { day: 43, ch: 'naples', rank: 'Guest chef in Naples', what: 'Fresh mozzarella', adds: ['mozzarella'], recipe: 'caprese' },
  { day: 44, ch: 'naples', rank: 'Maestro of Naples', what: 'Chapter complete!', adds: [], recipe: 'margherita' },
  { day: 45, ch: 'sicily', rank: 'Guest chef in Sicily', what: 'Norma sauce', adds: ['norma'], recipe: 'norma' },
  { day: 47, ch: 'sicily', rank: 'Guest chef in Sicily', what: 'Busiate, twisted by hand', adds: ['busiate'], recipe: 'busiate' },
  { day: 49, ch: 'sicily', rank: 'Guest chef in Sicily', what: 'Pesto alla trapanese', adds: ['trapanese'], recipe: 'trapanese' },
  { day: 51, ch: 'sicily', rank: 'Guest chef in Sicily', what: 'Ricotta salata', adds: ['ricotta'], recipe: 'granita' },
  { day: 52, ch: 'sicily', rank: 'Grand Maestro of Italy', what: 'The whole journey!', adds: [], recipe: 'cannoli' },
];
const placeName = ch => ch.region === ch.name ? ch.name : `${ch.name}, ${ch.region}`;
const rankFor = day => UNLOCKS.filter(u => u.day <= day).pop().rank;
const isChapterStart = u => u.day > 1 && CHAPTERS.some(c => c.start === u.day);
const SAFETY = 'Cook with a grown-up. They handle the stove, the oven, boiling water and sharp knives.';
const NUT_NOTE = ' This one has nuts, so check for allergies first.';
const RECIPES = {
  dough: { title: "Nonna's fresh egg pasta", serves: 'Serves 2', time: '1 hour with resting',
    ingredients: ['2 cups (200 g) flour, "00" or all-purpose', '2 large eggs', 'A pinch of salt'],
    steps: ['Pour the flour on the table in a mountain. Push a deep hole in the top, like a volcano.', 'Crack the eggs into the hole. Beat them with a fork, pulling in a little flour at a time.', 'Knead with your hands for 8 to 10 minutes, until the dough is smooth as a baby\'s cheek.', 'Wrap it up and let it rest for 30 minutes.', 'Roll it so thin you can almost see your hand through it, then cut your shape.'],
    tip: 'Sticky dough? A little more flour. Cracking dough? Wet your hands.' },
  pappardelle: { title: 'Pappardelle with mushrooms', serves: 'Serves 2', time: '30 minutes',
    ingredients: ['1 batch of fresh egg pasta', '300 g mushrooms (porcini if you can find them, or cremini)', '2 tablespoons olive oil and 1 of butter', '1 clove garlic', 'A handful of parsley, chopped', 'Salt, pepper and grated Parmigiano'],
    steps: ['Roll the dough thin and cut ribbons as wide as two of your fingers. Those are pappardelle!', 'Slice the mushrooms.', 'Warm the oil, butter and garlic gently, then cook the mushrooms until golden, about 8 minutes. Add parsley and salt.', 'Boil the pappardelle for 2 to 3 minutes and toss them with the mushrooms and a splash of pasta water.'],
    tip: 'In autumn, Tuscan families hunt for porcini in the woods. Only pick wild mushrooms with an expert!' },
  ravioli: { title: 'Ricotta and spinach ravioli', serves: 'Serves 3', time: '1 hour',
    ingredients: ['1 batch of fresh egg pasta', '1 cup ricotta', '1 cup cooked spinach, squeezed dry and chopped', '1/2 cup grated Parmigiano', '1 egg yolk', 'A pinch of nutmeg and salt'],
    steps: ['Mix the ricotta, spinach, Parmigiano, yolk, nutmeg and salt in a bowl.', 'Roll two thin sheets of dough.', 'Put one teaspoon of filling on the first sheet, two fingers apart. Just one spoonful each!', 'Lay the second sheet on top and press the air out around every little mound.', 'Cut squares and press the edges with a fork. Boil 3 to 4 minutes, until they float.'],
    tip: 'In Tuscany they serve these with melted butter and sage. Squeeze out every air bubble, or they pop in the pot.' },
  pici: { title: 'Hand-rolled pici from Siena', serves: 'Serves 3', time: '1 hour with resting',
    ingredients: ['300 g flour', 'About 150 ml warm water', '1 tablespoon olive oil', 'A pinch of salt', 'Semolina for dusting'],
    steps: ['Mix the flour, water, oil and salt, then knead for 10 minutes until smooth. No eggs in this one!', 'Cover it and let it rest for 30 minutes.', 'Flatten the dough about as thick as your finger and cut it into thin strips.', 'Roll each strip under your palms on the table into a long, fat noodle, like making a clay snake.', 'Dust them with semolina and boil for 6 to 8 minutes.'],
    tip: 'Pici come from the countryside around Siena. Every one is a little lumpy and different. That is the charm!' },
  aglione: { title: "Pici all'aglione", serves: 'Serves 3', time: '40 minutes',
    ingredients: ['4 big cloves of garlic (in Tuscany, one giant aglione clove)', '3 tablespoons olive oil', '1 can (400 g) peeled tomatoes', 'Salt', 'A pinch of chili, if you like it spicy'],
    steps: ['Slice the garlic thinly.', 'Cook it in the oil over very low heat for about 10 minutes, until soft and pale. Never brown!', 'Crush in the tomatoes with your hands and simmer for 20 minutes.', 'Mash the soft garlic into the sauce with a fork and toss with hot pici.'],
    tip: 'Aglione is a giant, gentle garlic grown in the Val di Chiana. Slow cooking makes any garlic taste sweet.' },
  pancetta: { title: 'Crispy pancetta', serves: 'For sprinkling', time: '10 minutes',
    ingredients: ['100 g pancetta, cut in small cubes'],
    steps: ['Put the cubes in a cold pan. No oil needed.', 'Turn the heat to medium. The fat melts and the pancetta fries in it.', 'Stir until golden and crispy, about 8 minutes.', 'Scoop it onto a paper towel to drain.'],
    tip: 'Pancetta is pork belly cured with salt and pepper. A little goes a long way.' },
  pomarola: { title: 'Pomarola, Tuscan tomato sauce', serves: 'Serves 4', time: '45 minutes',
    ingredients: ['1 kg ripe tomatoes (or 2 cans of peeled tomatoes)', '1 onion, 1 carrot and 1 celery stick, chopped', '4 tablespoons olive oil', 'A bunch of basil', 'Salt'],
    steps: ['Put the tomatoes, onion, carrot, celery, oil and basil in a pot together.', 'Simmer gently for 30 minutes, stirring now and then.', 'Push everything through a food mill or sieve, so it turns silky smooth.', 'Add salt and a drizzle of fresh olive oil.'],
    tip: 'Every summer, Tuscan nonnas cook pots of pomarola and seal it in jars to last all winter.' },
  ragu: { title: 'Tagliatelle al ragù', serves: 'Serves 4', time: '3 hours, mostly waiting',
    ingredients: ['1 onion, 1 carrot and 1 celery stick, chopped tiny', '2 tablespoons olive oil', '250 g ground beef and 250 g ground pork', '1/2 cup milk', '1 cup tomato passata', 'Fresh tagliatelle and grated Parmigiano'],
    steps: ['Cook the onion, carrot and celery slowly in the oil for 10 minutes. Italians call this a soffritto.', 'Add the meat and stir until it is all brown.', 'Pour in the milk and let it bubble away. It makes the ragù extra tender.', 'Stir in the tomato, turn the heat to low and simmer for 2 to 3 hours, stirring now and then.', 'Toss with tagliatelle and a shower of Parmigiano.'],
    tip: 'In Bologna, ragù goes with wide tagliatelle, never spaghetti! The city even keeps an official recipe.' },
  tortellini: { title: 'Tortellini in brodo', serves: 'Serves 6', time: '2 hours',
    ingredients: ['1 batch of fresh egg pasta', '100 g pork loin, 100 g prosciutto and 100 g mortadella', '150 g grated Parmigiano', '1 egg and a pinch of nutmeg', '1.5 liters of chicken or beef broth'],
    steps: ['A grown-up browns the pork, then grinds it with the prosciutto and mortadella.', 'Mix in the Parmigiano, egg and nutmeg.', 'Roll the pasta very thin and cut squares as big as a stamp.', 'Put a dot of filling on each, fold it into a triangle, then wrap the two corners around your finger and pinch.', 'Simmer them in the broth for 2 to 3 minutes and serve them in it.'],
    tip: 'Legend says an innkeeper shaped the first tortellini after the belly button of the goddess Venus!' },
  prosciutto: { title: 'Prosciutto e melone', serves: 'Serves 4', time: '10 minutes, no cooking',
    ingredients: ['1 ripe cantaloupe melon', '8 thin slices of Prosciutto di Parma'],
    steps: ['A grown-up cuts the melon into wedges and scoops out the seeds.', 'Slice off the rind.', 'Wrap one slice of prosciutto around each wedge.', 'Serve it cold, as a starter on a hot day.'],
    tip: 'Prosciutto di Parma is only pork and sea salt, dried for a year or more in the breezy hills near Parma.' },
  lasagne: { title: 'Lasagne verdi alla bolognese', serves: 'Serves 8', time: '1 hour, plus the ragù',
    ingredients: ['Egg pasta dough with a handful of cooked, chopped spinach kneaded in', '1 batch of ragù', 'Béchamel: 60 g butter, 60 g flour, 750 ml milk, nutmeg', '1 cup grated Parmigiano'],
    steps: ['Roll the green dough and cut big sheets. Boil them for 1 minute and lay them on a towel.', 'Make the béchamel: melt the butter, stir in the flour, then whisk in the milk until thick.', 'In a baking dish, layer ragù, pasta, béchamel and Parmigiano. Repeat 5 or 6 times.', 'Bake at 200°C (400°F) for about 30 minutes, until bubbling and golden.'],
    tip: 'Bologna\'s lasagne is green, from spinach in the dough. Chapter complete: Nonna packs her bags for Genoa!' },
  pesto: { title: 'Pesto alla genovese, made in a mortar', serves: 'Serves 4', time: '20 minutes, no cooking',
    ingredients: ['2 big handfuls of small basil leaves', '2 tablespoons pine nuts', '1 small clove garlic and a pinch of coarse salt', '4 tablespoons Parmigiano and 2 of pecorino, grated', 'About 1/2 cup mild olive oil'],
    steps: ['Crush the garlic and salt in a mortar.', 'Add the basil a little at a time and grind it with a gentle circle, not a pound.', 'Add the pine nuts and crush them in.', 'Stir in the cheeses, then the oil, a little at a time.', 'Toss with trofie. Never cook pesto: the heat of the pasta is enough.'],
    tip: 'Genoa\'s small-leaf basil is famous, and so is grinding it in a marble mortar.' + NUT_NOTE },
  noci: { title: 'Salsa di noci, walnut sauce', serves: 'Serves 4', time: '15 minutes',
    ingredients: ['100 g walnuts', '1 slice of bread without the crust, soaked in milk', '1 small clove garlic', '3 tablespoons grated Parmigiano', '3 tablespoons olive oil', 'A splash of milk'],
    steps: ['Squeeze the milk out of the bread.', 'Grind the walnuts, garlic, bread and cheese in a mortar or blender.', 'Add the oil and a splash of milk until it is as creamy as yogurt.', 'Toss with pasta and a little pasta water.'],
    tip: 'In Liguria this sauce goes on pansoti, ravioli stuffed with wild greens.' + NUT_NOTE },
  trofie: { title: 'Trofie with pesto, potatoes and green beans', serves: 'Serves 4', time: '1 hour',
    ingredients: ['300 g flour and about 150 ml water, for trofie', '2 small potatoes, peeled and cubed', 'A handful of green beans, cut in pieces', '1 batch of pesto alla genovese'],
    steps: ['Knead the flour and water into a smooth dough and rest it 30 minutes.', 'Pinch off a pea-size piece and roll it under the side of your hand, so it twists into a little spiral.', 'Boil the potatoes for 5 minutes, then add the beans and the trofie and cook about 8 minutes more.', 'Drain, then toss everything with pesto and a spoon of the cooking water.'],
    tip: 'Cooking the potatoes with the pasta makes the pesto extra creamy. This is how Genoa does it.' + NUT_NOTE },
  focaccia: { title: 'Focaccia genovese', serves: 'One big tray', time: '3 hours with rising',
    ingredients: ['500 g flour', '325 ml water', '7 g dry yeast', '2 teaspoons salt', '6 tablespoons olive oil, plus coarse salt for the top'],
    steps: ['Mix the flour, water, yeast, salt and 2 tablespoons of oil. Knead until smooth and let it rise for an hour.', 'Stretch it into an oiled baking tray and let it rise again for 45 minutes.', 'Press deep dimples all over with your fingertips. This is the best part!', 'Whisk the rest of the oil with 3 tablespoons of water and pour it into the dimples. Sprinkle coarse salt.', 'Bake at 220°C (430°F) for 15 to 20 minutes, until golden.'],
    tip: 'In Genoa, some people dunk focaccia in their morning cappuccino! Next stop: Rome.' },
  amatriciana: { title: "Bucatini all'amatriciana", serves: 'Serves 4', time: '30 minutes',
    ingredients: ['400 g bucatini', '150 g guanciale, cut in strips', '1 can (400 g) peeled tomatoes', '50 g grated Pecorino Romano', 'A pinch of chili, if you like'],
    steps: ['Cook the guanciale in a dry pan until the fat melts and the strips turn crispy. Lift them out.', 'Crush the tomatoes into the pan and simmer for 10 to 15 minutes.', 'Stir the guanciale back in.', 'Toss with the bucatini and a big handful of Pecorino.'],
    tip: 'It comes from Amatrice, a mountain town near Rome. The official recipe has no onion and no garlic!' },
  carbonara: { title: 'Spaghetti alla carbonara', serves: 'Serves 2', time: '20 minutes',
    ingredients: ['200 g spaghetti', '2 eggs and 2 extra yolks', '1 cup grated Pecorino Romano', '100 g guanciale', 'Lots of black pepper'],
    steps: ['Crisp the guanciale in a pan, then take the pan off the heat.', 'Whisk the eggs, yolks, pecorino and pepper in a bowl.', 'Boil the spaghetti. Save a cup of the water.', 'Toss the hot pasta with the guanciale. Away from the heat, pour in the egg mix and a splash of water and stir fast until silky.'],
    tip: 'No cream in a real Roman carbonara! Off the heat, so the eggs turn creamy instead of scrambled.' },
  alfredo: { title: 'Fettuccine Alfredo, the Roman way', serves: 'Serves 2', time: '20 minutes',
    ingredients: ['200 g fresh fettuccine', '4 tablespoons butter', '1 cup finely grated Parmigiano-Reggiano', 'A cup of the pasta cooking water'],
    steps: ['Roll your dough and fold it up loosely. Cut ribbons about as wide as your pinky.', 'Boil the fettuccine in salty water for 2 to 3 minutes. Save a cup of the water.', 'Put the butter in a big warm bowl and add the hot pasta.', 'Add the cheese and a splash of pasta water, then toss, toss, toss until it turns creamy.'],
    tip: 'Alfredo di Lelio made this in his Rome restaurant over 100 years ago. No cream: butter, cheese and a good toss do the magic.' },
  gricia: { title: 'Pasta alla gricia', serves: 'Serves 2', time: '20 minutes',
    ingredients: ['200 g rigatoni or spaghetti', '100 g guanciale, cut in strips', '60 g grated Pecorino Romano', 'Black pepper'],
    steps: ['Crisp the guanciale slowly in a dry pan.', 'Boil the pasta and save a cup of the water.', 'Toss the pasta in the pan with the guanciale and a splash of water.', 'Off the heat, stir in the Pecorino and lots of pepper until creamy.'],
    tip: 'Gricia is the grandmother of Roman pasta: add tomato and it is amatriciana, add egg and it is carbonara.' },
  cacio: { title: 'Cacio e pepe', serves: 'Serves 2', time: '15 minutes',
    ingredients: ['200 g spaghetti or tonnarelli', '100 g Pecorino Romano, grated very fine', '1 teaspoon black pepper, freshly ground'],
    steps: ['Toast the pepper in a dry pan for a minute until it smells amazing.', 'Boil the pasta in less water than usual, so the water gets starchy. Save a cup.', 'Mix the Pecorino with a little lukewarm water into a smooth paste.', 'Toss the pasta with the pepper and a splash of water, then, off the heat, stir in the cheese paste fast.'],
    tip: 'Roman shepherds carried pecorino and pepper because they keep for weeks. Next stop: Naples!' },
  marinara: { title: 'Marinara, the sauce of Naples', serves: 'Serves 4', time: '25 minutes',
    ingredients: ['3 tablespoons olive oil', '2 cloves garlic, sliced', '1 can (400 g) San Marzano tomatoes', 'A pinch of dried oregano and salt', 'A few fresh basil leaves'],
    steps: ['Warm the oil and cook the garlic until it smells good and turns pale gold, not brown.', 'Crush in the tomatoes and add a pinch of salt and oregano.', 'Simmer for 15 to 20 minutes, stirring now and then.', 'Tear in the basil at the very end and toss with paccheri.'],
    tip: 'Marinara is named after the marinai, the sailors of Naples. San Marzano tomatoes grow near Mount Vesuvius.' },
  puttanesca: { title: 'Spaghetti alla puttanesca', serves: 'Serves 4', time: '25 minutes',
    ingredients: ['3 tablespoons olive oil and 2 cloves garlic', '2 anchovy fillets', '1 can (400 g) peeled tomatoes', 'A handful of black olives and 1 tablespoon capers', 'Chopped parsley'],
    steps: ['Warm the oil with the garlic and anchovies. Stir until the anchovies melt away.', 'Add the tomatoes and simmer for 10 minutes.', 'Stir in the olives and capers and cook 5 minutes more.', 'Toss with the pasta and sprinkle parsley.'],
    tip: 'It was invented in the 1950s on the island of Ischia, near Naples, from whatever was left in the pantry.' },
  gnocchi: { title: 'Gnocchi alla sorrentina', serves: 'Serves 4', time: '1 hour 30 minutes',
    ingredients: ['1 kg floury potatoes', 'About 300 g flour', 'A pinch of salt', '1 batch of tomato sauce with basil', '250 g mozzarella, cubed, and some Parmigiano'],
    steps: ['Boil the potatoes in their skins. A grown-up peels them while hot and mashes them.', 'Knead in the flour and salt until soft, not sticky.', 'Roll ropes as thick as your thumb, cut little pillows, and roll each one down a fork for ridges.', 'Boil until they float, then mix with the sauce and mozzarella in a baking dish.', 'Bake at 200°C (400°F) for 10 minutes, until the cheese is melty.'],
    tip: 'Sorrento serves these bubbling in little clay dishes. Ridges help the sauce stick!' },
  caprese: { title: 'Insalata caprese', serves: 'Serves 4', time: '10 minutes, no cooking',
    ingredients: ['3 ripe tomatoes', '250 g fresh mozzarella', 'A handful of basil leaves', 'Olive oil and a pinch of salt'],
    steps: ['A grown-up slices the tomatoes and mozzarella.', 'Lay them on a plate, taking turns: red, white, red, white.', 'Tuck basil leaves in between.', 'Drizzle with olive oil and sprinkle with salt.'],
    tip: 'It comes from the island of Capri. Red, white and green, just like the Italian flag.' },
  margherita: { title: 'Pizza Margherita', serves: '2 pizzas', time: '1 day with rising, or 3 hours',
    ingredients: ['500 g flour, 325 ml water, 3 g dry yeast, 10 g salt', 'Crushed San Marzano tomatoes with a pinch of salt', '250 g mozzarella, torn', 'Basil leaves and olive oil'],
    steps: ['Mix and knead the dough until smooth. Let it rise, covered, for a few hours or overnight in the fridge.', 'Split it into two balls and let them rise again.', 'Press each ball out from the middle with your fingertips, leaving a puffy edge.', 'Spread tomato, add mozzarella, and bake in the hottest oven you have until the edge is golden and blistered.', 'Top with basil and a drizzle of oil.'],
    tip: 'Legend says a pizza maker named Raffaele Esposito made it in 1889 for Queen Margherita, in the colors of the flag. Next stop: Sicily!' },
  norma: { title: 'Pasta alla Norma', serves: 'Serves 4', time: '45 minutes',
    ingredients: ['2 eggplants, cut in cubes', 'Olive oil and salt', '1 batch of tomato sauce with garlic and basil', '400 g rigatoni or busiate', 'Grated ricotta salata'],
    steps: ['Toss the eggplant with oil and salt and roast at 220°C (430°F) for 25 minutes, until golden. (In Sicily it is fried.)', 'Warm the tomato sauce and stir in most of the eggplant.', 'Toss with the pasta.', 'Top with the rest of the eggplant, basil and a snowfall of ricotta salata.'],
    tip: 'From Catania. It is named after Norma, an opera by Vincenzo Bellini, who was born there.' },
  busiate: { title: 'Busiate, twisted on a skewer', serves: 'Serves 3', time: '1 hour',
    ingredients: ['300 g durum wheat semolina', 'About 150 ml warm water', 'A pinch of salt'],
    steps: ['Knead the semolina and water into a firm dough and rest it 30 minutes.', 'Roll a thin rope, about as long as your hand.', 'Lay a wooden skewer across one end at an angle and roll, so the dough wraps around it like a spring.', 'Slide it off and let them dry a little. Boil for 6 to 8 minutes.'],
    tip: 'The name comes from busa, a stem of grass that Sicilian cooks once used to twist them.' },
  trapanese: { title: 'Pesto alla trapanese', serves: 'Serves 4', time: '15 minutes, no cooking',
    ingredients: ['300 g very ripe cherry tomatoes', '50 g blanched almonds', 'A big handful of basil', '1 small clove garlic', '40 g grated pecorino', 'About 1/3 cup olive oil and salt'],
    steps: ['Toast the almonds in a dry pan until they smell nutty. Let them cool.', 'Grind the almonds, garlic and basil in a mortar or blender.', 'Add the tomatoes and pecorino and blend until chunky.', 'Stir in the olive oil and salt, and toss with busiate.'],
    tip: 'Sailors from Genoa brought pesto to the port of Trapani. Sicilians added their own tomatoes and almonds.' + NUT_NOTE },
  granita: { title: 'Lemon granita', serves: 'Serves 6', time: '15 minutes, plus 3 hours freezing',
    ingredients: ['250 ml lemon juice (about 5 lemons)', '500 ml water', '150 g sugar'],
    steps: ['Stir the sugar into warm water until it disappears. Let it cool.', 'Mix in the lemon juice and pour it into a shallow dish.', 'Freeze it. Every 30 minutes, scrape it with a fork to make fluffy ice crystals.', 'After about 3 hours it is ready. Serve in glasses.'],
    tip: 'Sicilians eat granita for breakfast in summer, with a soft brioche bun for dunking!' },
  cannoli: { title: 'Cannoli siciliani', serves: '12 cannoli', time: '30 minutes, plus draining',
    ingredients: ['12 cannoli shells (from a bakery, or fried by a grown-up)', '500 g sheep\'s milk ricotta, drained overnight', '100 g powdered sugar', 'Mini chocolate chips', 'Chopped pistachios or candied orange for the ends'],
    steps: ['Whisk the drained ricotta with the powdered sugar until smooth.', 'Fold in the chocolate chips.', 'Spoon or pipe the filling into the shells, right before eating so they stay crunchy.', 'Dip the ends in pistachios and dust with powdered sugar.'],
    tip: 'Cannoli come from Palermo, made for Carnival long ago. Brava, Grand Maestro! You have cooked your way across Italy.' + NUT_NOTE },
};

// ---------- Real-world days: Nonna's garden, the mailbox and the Daily Dish ----------
// Crops grow on the real clock, even while the game is closed, and never wilt. Fresh food earns a bonus tip.
const CROPS = [
  { id: 'basil', name: 'Basil', one: 'basil', many: 'basil', mins: 20, yield: 3, bonus: 0.25, use: 'Pesto, or any plate with basil leaves' },
  { id: 'parsley', name: 'Parsley', one: 'parsley', many: 'parsley', mins: 60, yield: 4, bonus: 0.25, use: 'A fresh sprig on any plate' },
  { id: 'tomato', name: 'Tomatoes', one: 'tomato', many: 'tomatoes', mins: 240, yield: 6, bonus: 0.5, use: 'Plates with a tomato sauce' },
  { id: 'garlic', name: 'Garlic', one: 'garlic bulb', many: 'garlic bulbs', mins: 480, yield: 8, bonus: 0.5, use: 'Garlic bread and aglione' },
];
const GARDEN_START = 4;
const BED_PRICES = [25, 40, 60, 90];      // beds five to eight
const WATER_CUT = 0.25;                   // watering once cuts the time left by a quarter
const BASKET_MAX = 40;
const TOMATO_SAUCES = ['marinara', 'aglione', 'ragu', 'amatriciana', 'puttanesca', 'norma', 'trapanese'];

// Nonna's little sister orders the Daily Dish: one plate, the same for every player on the same date.
const DAILY_EPOCH = '2026-10-13';
const DAILY_STAR = 1;                     // per star: 10 coins
const ZIA_LELLA = { name: 'Zia Lella', short: 'Zia Lella', bio: "Nonna's little sister, visiting from Sorrento", patience: 1.3, breadLike: 0, visitor: true, daily: true,
  look: { skin: '#f0c9a8', hair: '#a9a9a9', hairStyle: 'curly', old: true, glasses: true, hat: 'paglietta', shirt: '#f2c23a', longSleeve: true, scarf: '#2f5ea8', pants: '#3a3a40', shoes: '#7d4a26' },
  order: { shape: 'spaghetti', sauce: 'marinara', toppings: [] },
  lines: { hello: 'Ciao, ciao! Lella is here. Let us see if you cook like my sister.', order: '',
    great: 'Perfetto! I am telling the whole family!', good: 'Brava! Very good. Tomorrow, even better, sì?', bad: 'Hmm. My sister will hear about this. Try again tomorrow!', angry: 'I waited and waited! I will come back tomorrow.' } };

// A letter in the mailbox every real day. The sender is Nonna, her sister, or a regular you have met.
const LETTERS = [
  { id: 'garden', from: 'nonna', sign: 'Love, Nonna', text: 'Tesoro! I dug up the old garden behind the restaurant. Four beds, good soil, and a watering can that only leaks a little. Plant some seeds and come back later to pick what grows. Fresh basil and tomatoes make customers happy, and happy customers tip more!' },
  { id: 'lella', from: 'lella', sign: 'Baci, Zia Lella', text: 'Ciao from Sorrento! My sister says you are the best young cook in Italy. We will see! Every day I order one plate, the very same plate for every cook in the world. Find the Daily Dish at the top of the morning page, make it perfect, and tell your friends how you did.' },
  { id: 'n1', from: 'nonna', sign: 'Love, Nonna', text: 'When I was a little girl, my mamma made pasta every Sunday. The whole street could smell the sauce. Now our little shop smells the same way. I am so proud of you.' },
  { id: 'n2', from: 'nonna', sign: 'Love, Nonna', text: 'Did you water the garden? Basil is thirsty like a little bird. A little water and it grows big and happy.' },
  { id: 'n3', from: 'nonna', sign: 'Love, Nonna', text: 'I found my old recipe book in the attic. Half the pages are stuck together with tomato sauce. Those are the best recipes.' },
  { id: 'n4', from: 'nonna', sign: 'Love, Nonna', text: 'Zia Lella called. She says your cooking is almost as good as hers. From my sister, that is the highest compliment there is!' },
  { id: 'n5', from: 'nonna', sign: 'Love, Nonna', text: 'A good cook tastes everything, cleans as she goes, and never, ever rushes the sauce. Two out of three is a fine start, tesoro.' },
  { id: 'rosa', from: 'rosa', sign: 'Your friend, Rosa', text: 'Dear, your Nonna and I went to school together a hundred years ago. She was always the best cook in class, and you are just like her. Save me a table by the window!' },
  { id: 'tony', from: 'tony', sign: 'Tony, your mail carrier', text: 'Funny thing: I deliver everybody\'s letters, but nobody ever writes to me. So I am writing to you! Can I get my penne extra fast tomorrow? Big route.' },
  { id: 'lucia', from: 'lucia', sign: 'Ciao, Lucia', text: 'I drew your restaurant for my art class. My teacher said the noodles looked too delicious to be real. I told her they ARE real!' },
  { id: 'paolo', from: 'paolo', sign: 'Paolo', text: 'We are building a new bridge by the river, and all the workers talk about your pasta at lunch. Make the plates big, okay? Builders are always hungry.' },
  { id: 'giulia', from: 'giulia', sign: 'Giulia (the blog)', text: 'I am writing a post about the best pasta in town. You are on the list. I will not say which number yet. Keep surprising me!' },
  { id: 'bruno', from: 'bruno', sign: 'Bruno, from the harbor', text: 'The boats came in early with a big catch. The sea was calm and the sky was pink. Days like this make a fisherman hungry for a good plate of pasta.' },
  { id: 'nina', from: 'nina', sign: 'Love, Nina (age 7)', text: 'Dear Chef. I like cheese. I like MORE cheese. Please put more cheese on everything. My mamma helped me spell.' },
  { id: 'carlo', from: 'carlo', sign: 'Carlo, your mayor', text: 'On behalf of the town, thank you for making us famous! People drive in from the city just to eat your pasta. The town council is very pleased.' },
  { id: 'sal', from: 'sal', sign: 'Sal, next door', text: 'My espresso bar is right next door, so I smell your sauce all day long. It is very hard to work like this! Come by for a coffee, on the house.' },
  { id: 'marta', from: 'marta', sign: 'Marta', text: 'My music students made up a song about spaghetti today. It was very loud and very silly. I think you would have liked it.' },
  { id: 'gino', from: 'gino', sign: 'Gino', text: 'Yo Chef! I almost landed a new skateboard trick in the piazza today. Celebrating with pasta later. Extra chili, please!' },
];
// Nonna's envelope: a little more each day you keep visiting, and something special every seventh day.
const MAIL_GIFT = streak => streak > 0 && streak % 7 === 0 ? 10 : [0, 2, 3, 4][streak] || 5;
