export type FlowerFamily = {
  slug: string;
  name: string;
  plural: string;
  /** Catalog stem slugs to preload in the builder */
  stems: string[];
  title: string;
  metaDescription: string;
  /** 40–60 word direct answer (AEO) */
  answer: string;
  colors?: { color: string; meaning: string }[];
  occasions: string[];
  facts: string[];
  faq: { q: string; a: string }[];
};

export const FLOWER_FAMILIES: FlowerFamily[] = [
  {
    slug: "rose",
    name: "Rose",
    plural: "Roses",
    stems: ["red-rose", "pink-rose", "white-rose", "yellow-rose", "peach-rose"],
    title: "Rose Meaning by Color: Red, Pink, White, Yellow & Peach",
    metaDescription: "What does a rose mean? Red roses mean romantic love, pink means gratitude, white means new beginnings, yellow means friendship. Full rose color guide.",
    answer:
      "Roses symbolize love, but the color changes the message: red means deep romantic love, pink means gratitude and admiration, white means new beginnings and sincerity, yellow means friendship and joy, and peach means thanks. The number of roses can add meaning too.",
    colors: [
      { color: "Red", meaning: "Romantic love, passion, \"I love you\"" },
      { color: "Pink", meaning: "Gratitude, admiration, gentle affection" },
      { color: "White", meaning: "New beginnings, purity, sincere apology" },
      { color: "Yellow", meaning: "Friendship, joy, warmth" },
      { color: "Peach", meaning: "Sincerity, thanks, appreciation" },
    ],
    occasions: ["valentines-day", "anniversary", "apology", "friendship", "thank-you"],
    facts: [
      "Fossils show roses have existed for about 35 million years.",
      "One rose traditionally means love at first sight; twelve mean \"be mine.\"",
      "The rose is the national flower of the United States and England.",
    ],
    faq: [
      { q: "What do 3 roses mean?", a: "Three roses traditionally mean \"I love you\", one rose for each word." },
      { q: "Which rose color means friendship?", a: "Yellow roses are the classic symbol of friendship and joy." },
      { q: "What rose do you give to say sorry?", a: "White roses, which symbolize a fresh start and sincerity." },
    ],
  },
  {
    slug: "tulip",
    name: "Tulip",
    plural: "Tulips",
    stems: ["pink-tulip", "red-tulip", "yellow-tulip", "purple-tulip"],
    title: "Tulip Meaning by Color – What Tulips Symbolize",
    metaDescription: "Tulips symbolize perfect love. Red tulips declare love, pink mean care, yellow mean cheer, purple mean royalty. Learn tulip color meanings.",
    answer:
      "Tulips are a symbol of perfect, uncomplicated love. Red tulips are a declaration of love, pink tulips mean care and happiness, yellow tulips mean cheerful thoughts and sunshine, and purple tulips mean royalty and admiration. They are a softer alternative to roses.",
    colors: [
      { color: "Red", meaning: "Declaration of love" },
      { color: "Pink", meaning: "Care, affection, happiness" },
      { color: "Yellow", meaning: "Cheerful thoughts, sunshine" },
      { color: "Purple", meaning: "Royalty, admiration, respect" },
    ],
    occasions: ["crush", "mothers-day", "valentines-day", "apology"],
    facts: [
      "In the 1630s \"tulip mania\" made single tulip bulbs cost more than houses in the Netherlands.",
      "Tulips keep growing after being cut, up to an inch in a vase.",
      "Tulips originally come from Central Asia, not Holland.",
    ],
    faq: [
      { q: "Are tulips romantic?", a: "Yes. Red tulips in particular are a classic declaration of love." },
      { q: "What do pink tulips mean?", a: "Care, affection and happiness, which makes them great for crushes, friends and moms." },
    ],
  },
  {
    slug: "sunflower",
    name: "Sunflower",
    plural: "Sunflowers",
    stems: ["sunflower"],
    title: "Sunflower Meaning – What Does a Sunflower Symbolize?",
    metaDescription: "Sunflowers symbolize loyalty, warmth and positivity. Learn what sunflowers mean and when to send them in a digital bouquet.",
    answer:
      "Sunflowers symbolize loyalty, adoration and positivity, because young sunflowers turn to follow the sun. They are one of the best flowers for birthdays, get well wishes, friendships and congratulations, and they bring instant warmth to any bouquet.",
    occasions: ["birthday", "get-well", "friendship", "graduation", "congratulations"],
    facts: [
      "Young sunflowers track the sun from east to west, a behavior called heliotropism.",
      "One sunflower head is made of up to 2,000 tiny flowers.",
      "The seeds are arranged in Fibonacci spirals.",
    ],
    faq: [
      { q: "Are sunflowers romantic?", a: "They mean adoration and loyalty, so they can be romantic, but they are more often given for joy and friendship." },
      { q: "What do sunflowers mean in a bouquet?", a: "Warmth, happiness and \"you light up my life.\"" },
    ],
  },
  {
    slug: "daisy",
    name: "Daisy",
    plural: "Daisies",
    stems: ["daisy"],
    title: "Daisy Meaning – What Daisies Symbolize",
    metaDescription: "Daisies symbolize innocence, new beginnings and true love. Learn the meaning of daisies and how to use them in a digital bouquet.",
    answer:
      "Daisies symbolize innocence, new beginnings and loyal love. Their simple white petals and bright centers make them a cheerful, easygoing flower for friends, get well wishes and birthdays. The name comes from \"day's eye\" because they open at dawn.",
    occasions: ["friendship", "get-well", "birthday", "crush"],
    facts: [
      "\"Daisy\" comes from the Old English \"dæges ēage,\" meaning day's eye.",
      "A daisy is actually two flowers in one: ray florets and disc florets.",
      "\"He loves me, he loves me not\" is traditionally played with daisy petals.",
    ],
    faq: [{ q: "Are daisies good for a friend?", a: "Yes. Daisies are cheerful, loyal and low-pressure, perfect for friends." }],
  },
  {
    slug: "gerbera",
    name: "Gerbera daisy",
    plural: "Gerberas",
    stems: ["gerbera", "pink-gerbera"],
    title: "Gerbera Daisy Meaning – Cheerful Flowers Explained",
    metaDescription: "Gerbera daisies symbolize cheerfulness and innocence. See gerbera color meanings and send one in a free digital bouquet.",
    answer:
      "Gerbera daisies symbolize cheerfulness, innocence and the joy of life. Orange gerberas mean warmth and sunshine, pink gerberas mean admiration, and red gerberas mean love. Their big, bold faces make them a favorite for birthdays and congratulations.",
    colors: [
      { color: "Orange", meaning: "Warmth, sunshine, happiness" },
      { color: "Pink", meaning: "Admiration, gentle love" },
      { color: "Red", meaning: "Love and passion" },
    ],
    occasions: ["birthday", "congratulations", "get-well"],
    facts: ["Gerberas are the fifth most popular cut flower in the world.", "They are native to South Africa."],
    faq: [{ q: "What does an orange gerbera mean?", a: "Warmth, sunshine and happiness." }],
  },
  {
    slug: "peony",
    name: "Peony",
    plural: "Peonies",
    stems: ["peony", "coral-peony"],
    title: "Peony Meaning – Symbol of Romance and Good Fortune",
    metaDescription: "Peonies symbolize romance, prosperity and a happy marriage. Learn peony meanings and add them to a digital bouquet.",
    answer:
      "Peonies symbolize romance, prosperity, good fortune and a happy marriage. They are known as the traditional 12th wedding anniversary flower. Their full, ruffled blooms make any bouquet feel luxurious, and pink peonies are among the most shared flowers on social media.",
    occasions: ["anniversary", "mothers-day", "congratulations"],
    facts: [
      "Peonies can live for over 100 years.",
      "In China the peony is called the \"king of flowers.\"",
      "Peonies are the 12th wedding anniversary flower.",
    ],
    faq: [{ q: "Are peonies romantic?", a: "Yes. Peonies stand for romance and a happy, lasting relationship." }],
  },
  {
    slug: "lily",
    name: "Lily",
    plural: "Lilies",
    stems: ["white-lily", "stargazer-lily"],
    title: "Lily Meaning – White Lilies, Stargazers and More",
    metaDescription: "White lilies mean purity and remembrance; stargazer lilies mean ambition. Learn lily meanings and when to send them.",
    answer:
      "Lilies symbolize purity, renewal and remembrance. White lilies are the traditional sympathy flower, while pink stargazer lilies stand for ambition and abundance, making them a great graduation or congratulations flower. Real lilies are toxic to cats, so digital ones are the pet-safe choice.",
    colors: [
      { color: "White", meaning: "Purity, peace, remembrance" },
      { color: "Pink (Stargazer)", meaning: "Ambition, abundance, prosperity" },
    ],
    occasions: ["sympathy", "graduation", "congratulations"],
    facts: ["Real lilies are highly toxic to cats.", "Stargazer lilies were first bred in 1978 in California."],
    faq: [{ q: "What flower is best for sympathy?", a: "White lilies are the traditional flower of sympathy and remembrance." }],
  },
  {
    slug: "lavender",
    name: "Lavender",
    plural: "Lavender",
    stems: ["lavender"],
    title: "Lavender Meaning – Calm, Devotion and Grace",
    metaDescription: "Lavender symbolizes calm, devotion and grace. Learn what lavender means in a bouquet and add it to your own.",
    answer:
      "Lavender symbolizes calm, serenity, devotion and grace. In a bouquet it adds a soft purple texture and a message of peace, which makes it a thoughtful addition for apologies, get well wishes and Mother's Day.",
    occasions: ["apology", "mothers-day", "get-well"],
    facts: ["The name comes from the Latin \"lavare,\" to wash.", "Lavender is a member of the mint family."],
    faq: [{ q: "Is lavender good for an apology bouquet?", a: "Yes. Its calm, peaceful meaning softens an apology." }],
  },
  {
    slug: "hydrangea",
    name: "Hydrangea",
    plural: "Hydrangeas",
    stems: ["hydrangea", "pink-hydrangea"],
    title: "Hydrangea Meaning – Gratitude and Heartfelt Emotion",
    metaDescription: "Hydrangeas symbolize heartfelt gratitude and understanding. See blue and pink hydrangea meanings.",
    answer:
      "Hydrangeas symbolize heartfelt emotion, gratitude and understanding. Blue hydrangeas are often given as an apology or thank you, while pink hydrangeas express sincere feelings. Their cloud-like clusters make a bouquet look full with a single stem.",
    colors: [
      { color: "Blue", meaning: "Gratitude, understanding, apology" },
      { color: "Pink", meaning: "Sincere emotion, heartfelt love" },
    ],
    occasions: ["thank-you", "apology"],
    facts: ["Hydrangea color can change with soil pH: acidic soil turns them blue."],
    faq: [{ q: "What do blue hydrangeas mean?", a: "Gratitude and understanding; they are also a gentle apology flower." }],
  },
  {
    slug: "carnation",
    name: "Carnation",
    plural: "Carnations",
    stems: ["pink-carnation", "red-carnation"],
    title: "Carnation Meaning – The Mother's Day Flower",
    metaDescription: "Pink carnations mean a mother's love; red carnations mean admiration. Learn carnation meanings by color.",
    answer:
      "Carnations symbolize love, fascination and distinction. Pink carnations mean a mother's undying love and are the official Mother's Day flower, while red carnations mean deep admiration. They are one of the longest-lasting cut flowers.",
    colors: [
      { color: "Pink", meaning: "A mother's love, gratitude" },
      { color: "Red", meaning: "Admiration, deep love" },
    ],
    occasions: ["mothers-day", "valentines-day"],
    facts: ["Carnations were chosen as the Mother's Day flower by founder Anna Jarvis."],
    faq: [{ q: "Why are carnations the Mother's Day flower?", a: "Anna Jarvis, who founded Mother's Day, handed out carnations, her mother's favorite flower." }],
  },
  {
    slug: "cosmos",
    name: "Cosmos",
    plural: "Cosmos",
    stems: ["cosmos", "white-cosmos"],
    title: "Cosmos Flower Meaning – Order, Peace and Harmony",
    metaDescription: "Cosmos flowers symbolize order, peace and harmony. Learn their meaning and add them to a digital bouquet.",
    answer:
      "Cosmos flowers symbolize order, peace and harmony. The name comes from the Greek \"kosmos,\" meaning a balanced, ordered universe. Their airy petals add a wildflower feel to any bouquet and pair well with daisies and tulips.",
    occasions: ["crush", "friendship", "sympathy"],
    facts: ["Spanish priests named cosmos for their evenly placed petals."],
    faq: [{ q: "What does cosmos mean in a bouquet?", a: "Peace, harmony and balance." }],
  },
  {
    slug: "anemone",
    name: "Anemone",
    plural: "Anemones",
    stems: ["anemone"],
    title: "Anemone Meaning – The Windflower Explained",
    metaDescription: "Anemones symbolize anticipation and protection. Learn what the windflower means.",
    answer:
      "Anemones, also called windflowers, symbolize anticipation and protection against bad luck. The white anemone with its dark center is a favorite of modern florists for its striking, editorial look.",
    occasions: ["crush", "congratulations"],
    facts: ["The name comes from the Greek word for wind, \"anemos.\""],
    faq: [{ q: "Why is it called a windflower?", a: "Its name comes from the Greek word for wind, and its petals were said to open in the breeze." }],
  },
  {
    slug: "ranunculus",
    name: "Ranunculus",
    plural: "Ranunculus",
    stems: ["ranunculus", "peach-ranunculus"],
    title: "Ranunculus Meaning – \"You Are Charming\"",
    metaDescription: "Ranunculus means \"I am dazzled by your charms.\" Learn the meaning of ranunculus and send one to your crush.",
    answer:
      "Ranunculus flowers carry the Victorian message \"I am dazzled by your charms\" or simply \"you are charming.\" Their layered, paper-thin petals make them a perfect crush or anniversary flower.",
    occasions: ["crush", "anniversary"],
    facts: ["A single ranunculus bloom can have over 100 petals."],
    faq: [{ q: "Is ranunculus good for a crush?", a: "Yes, its meaning is literally \"you are charming.\"" }],
  },
  {
    slug: "poppy",
    name: "Poppy",
    plural: "Poppies",
    stems: ["poppy"],
    title: "Poppy Meaning – Remembrance, Dreams and Imagination",
    metaDescription: "Red poppies symbolize remembrance and dreams. Learn the meaning of the poppy flower.",
    answer:
      "Red poppies symbolize remembrance, as well as sleep, dreams and imagination. They are worn to honor fallen soldiers, and in a bouquet they add a bold pop of red that feels artistic and modern.",
    occasions: ["sympathy", "congratulations"],
    facts: ["The remembrance poppy comes from the poem \"In Flanders Fields.\""],
    faq: [{ q: "What does a red poppy mean?", a: "Remembrance, and also dreams and imagination." }],
  },
  {
    slug: "babys-breath",
    name: "Baby's breath",
    plural: "Baby's breath",
    stems: ["babys-breath"],
    title: "Baby's Breath Meaning – Everlasting Love",
    metaDescription: "Baby's breath symbolizes everlasting love and innocence. Learn its meaning as a bouquet filler.",
    answer:
      "Baby's breath symbolizes everlasting love, purity and innocence. It is the classic bouquet filler: tiny white clusters that soften bold flowers like red roses and make a bouquet look fuller and dreamier.",
    occasions: ["anniversary", "valentines-day", "sympathy"],
    facts: ["Its scientific name is Gypsophila, meaning \"gypsum-loving.\""],
    faq: [{ q: "Why add baby's breath to roses?", a: "It softens the look and adds the meaning of everlasting love." }],
  },
  {
    slug: "forget-me-not",
    name: "Forget-me-not",
    plural: "Forget-me-nots",
    stems: ["forget-me-not"],
    title: "Forget-Me-Not Meaning – True Love and Remembrance",
    metaDescription: "Forget-me-nots symbolize true love and remembrance. Learn the meaning of this tiny blue flower.",
    answer:
      "Forget-me-nots symbolize true, faithful love and remembrance. The tiny blue flowers say \"remember me,\" which makes them lovely for long-distance friends, partners and memorials.",
    occasions: ["crush", "sympathy", "friendship"],
    facts: ["A German legend says a knight cried \"forget me not\" as he fell into a river."],
    faq: [{ q: "What do forget-me-nots mean?", a: "True love and remembrance: \"remember me.\"" }],
  },
  {
    slug: "cherry-blossom",
    name: "Cherry blossom",
    plural: "Cherry blossoms",
    stems: ["cherry-blossom"],
    title: "Cherry Blossom Meaning – The Beauty of Life",
    metaDescription: "Cherry blossoms symbolize the fleeting beauty of life and new beginnings. Learn the meaning of sakura.",
    answer:
      "Cherry blossoms, or sakura, symbolize the beauty and shortness of life and the start of something new. In Japan they mark spring and fresh starts, which makes them a thoughtful flower for graduations and new chapters.",
    occasions: ["graduation", "congratulations"],
    facts: ["Cherry trees usually bloom for only about two weeks."],
    faq: [{ q: "What does sakura mean?", a: "Sakura means cherry blossom and represents renewal and the fleeting beauty of life." }],
  },
  {
    slug: "eucalyptus",
    name: "Eucalyptus",
    plural: "Eucalyptus",
    stems: ["eucalyptus", "fern", "ruscus", "pampas"],
    title: "Bouquet Greenery Meanings – Eucalyptus, Fern, Ruscus, Pampas",
    metaDescription: "What does greenery mean in a bouquet? Eucalyptus means protection and healing, fern means sincerity, pampas means positivity.",
    answer:
      "Greenery gives a bouquet shape and meaning. Eucalyptus stands for protection and healing, ferns for sincerity, ruscus for lasting bonds, and pampas grass for positivity. Add two or three sprigs behind your flowers to make a digital bouquet look full and natural.",
    colors: [
      { color: "Eucalyptus", meaning: "Protection, healing, abundance" },
      { color: "Fern", meaning: "Sincerity, magic, humility" },
      { color: "Ruscus", meaning: "Lasting bonds" },
      { color: "Pampas grass", meaning: "Positivity, good vibes" },
    ],
    occasions: ["get-well", "friendship"],
    facts: ["Pampas grass became a top home-decor trend on Instagram and TikTok around 2019."],
    faq: [{ q: "Why add greenery to a bouquet?", a: "Greenery frames the flowers, adds depth and makes the bouquet look fuller." }],
  },
];

export const FAMILY_BY_SLUG = new Map(FLOWER_FAMILIES.map((f) => [f.slug, f]));
