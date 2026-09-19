
const DEFAULT_SETTINGS = {
    "texts": {
    "startButton": "Explore Universe",
    "loaderLoading": "preparing something special...",
    "loaderReady": "Universe Ready",
    "introTitle": "Today is about you Ryann!🎂⭐",
    "introSubtitle": "out of All days in the year, today is the one worth making a little brighter",
    "milestoneTitle": "Every star tells a story",
    "milestoneSubtitle": "right from small you where always a blessing, and a sweet heart to many, u mean alot to us ryann",
    "turningPointTitle": "A milestone worth celebrating",
    "turningPointSubtitle":"Another year, Another chapter. So happy that am living this moment with you and as your bestfriend❤️",
    "revealTitle": "But this Galaxy has one star",
    "revealSubtitle": "And thats you. So today is yout turn to shine.",
    "photoIndex": "Memories",
    "finalTitle": "HAPPY BIRTHDAY,BESTIE!",
    "finalSubtitle": "Happy birthday to one if the most important people in my life. thank you for all the laughs, conversatios, the memories. I genuinely hope this next chapter brings you everything you've been wwishing for. keep being you, keep shining, and remember that no matter how big this galaxy gets, you'll always have a place in mine ",
    "endTitle": "MADE WITH LOVE & CODE",
    "webglFallback": "Hardware rendering is unsupported on this device."
  },
  audio: {
    ambient: { m4a: 'music/galaxi.m4a', ogg: 'music/galaxi.ogg' },
    event: { m4a: 'music/happy.m4a', ogg: 'music/happy.ogg' }
  },
  photos: {
    "special": [
      { "path": "photos/birthday-pic.png", "caption": "The beginning of an incredible journey" },
      { "path": "photos/mirror-pic.jpg", "caption": "Shining bright through every single moment" }
    ],
    "gallery": [
      { "path": "photos/cute-bestie.jpg", "caption": "Laughter, happiness, and unforgettable days" },
      { "path": "photos/baby.png", "caption": "Grateful for all the beautiful memories" },
      { "path": "photos/grad.jpg", "caption": "May your path always be filled with light" },
      { "path": "photos/hot-bestie.jpg", "caption": "To endless joy, blessings, and light-years together" }
    ]
  
  }
};

function deepMerge(base, override) {
  const clone = JSON.parse(JSON.stringify(base));
  if (!override) return clone;

  for (const key in override) {
    if (clone[key] && typeof clone[key] === 'object' && !Array.isArray(clone[key])) {
      clone[key] = deepMerge(clone[key], override[key]);
    } else {
      clone[key] = override[key];
    }
  }
  return clone;
}

export async function getSettings() {
  try {
    const res = await fetch('settings.json');
    if (!res.ok) throw new Error(`settings.json returned ${res.status}`);
    const raw = await res.json();
    return deepMerge(DEFAULT_SETTINGS, raw);
  } catch (err) {
    console.warn('settings.json could not be loaded, using defaults.', err);
    return deepMerge(DEFAULT_SETTINGS, {});
  }
}
