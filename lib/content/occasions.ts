export type Occasion = {
  slug: string;
  name: string;
  emoji: string;
  title: string;
  metaDescription: string;
  /** 40–60 word direct answer shown first on the page (AEO). */
  answer: string;
  flowers: string[];
  preset: { stems: string[]; wrapper: string; ribbon: string; background: string };
  messages: string[];
  faq: { q: string; a: string }[];
};

export const OCCASIONS: Occasion[] = [
  {
    slug: "birthday",
    name: "Birthday",
    emoji: "🎂",
    title: "Digital Birthday Flowers – Send a Free Bouquet Link",
    metaDescription: "Make a free digital birthday bouquet with sunflowers, gerberas and roses, add a birthday note and send it as a link that blooms open.",
    answer:
      "The best digital birthday bouquet is bright and cheerful: sunflowers for warmth, gerberas for joy and a few pink roses for affection. On Petalpost you can build one in under a minute, write a birthday note, and schedule the link to open exactly at midnight on their birthday.",
    flowers: ["sunflower", "gerbera", "rose", "daisy", "tulip"],
    preset: { stems: ["sunflower", "gerbera", "pink-gerbera", "yellow-tulip", "daisy", "daisy", "pink-rose", "babys-breath", "eucalyptus", "ruscus"], wrapper: "butter", ribbon: "cherry", background: "blush" },
    messages: [
      "Another year of you being iconic. Happy birthday 🎂",
      "These won't wilt, just like my love for you. HBD!",
      "Main character energy, all year long. Happy birthday!",
      "Sending you a bouquet because cake doesn't fit through the phone.",
      "May this year be as pretty as this bouquet (and you).",
      "Happy birthday to my favorite person. No notes.",
    ],
    faq: [
      { q: "Can I schedule a birthday bouquet to open at midnight?", a: "Yes. When writing your card, set an open date and time. The link shows a countdown until then and blooms open at that exact moment." },
      { q: "What flowers are good for a birthday?", a: "Sunflowers, gerberas and yellow roses say joy and friendship. Pink roses and peonies feel more affectionate. Mix two or three bright flowers with greenery for a balanced bouquet." },
      { q: "Is sending digital birthday flowers free?", a: "Yes. Making, sending and opening bouquets on Petalpost is completely free and needs no account." },
    ],
  },
  {
    slug: "anniversary",
    name: "Anniversary",
    emoji: "💞",
    title: "Digital Anniversary Bouquet – Romantic Flowers Online",
    metaDescription: "Send a romantic digital anniversary bouquet with red roses and peonies. Write a love note and share it as a link. Free, no signup.",
    answer:
      "For an anniversary, red roses remain the clearest symbol of deep love, and peonies add a sense of a happy, lasting relationship. A digital anniversary bouquet on Petalpost pairs those flowers with a handwritten-style love note and arrives as a link that unwraps on their phone.",
    flowers: ["rose", "peony", "ranunculus", "tulip", "babys-breath"],
    preset: { stems: ["red-rose", "red-rose", "red-rose", "peony", "peony", "ranunculus", "babys-breath", "babys-breath", "eucalyptus", "fern"], wrapper: "noir", ribbon: "ivory", background: "blush" },
    messages: [
      "Every year with you is my favorite year.",
      "Still choosing you. Happy anniversary 💞",
      "One more year of us. Here's to forever.",
      "Thank you for being my home.",
      "Loving you is the easiest thing I do.",
      "Same person, more in love. Happy anniversary.",
    ],
    faq: [
      { q: "What flowers mean love for an anniversary?", a: "Red roses mean romantic love, peonies mean a happy relationship, and baby's breath means everlasting love. A mix of the three is a classic anniversary bouquet." },
      { q: "Can I send an anniversary bouquet long distance?", a: "Yes. A Petalpost bouquet is a link, so it reaches anyone, anywhere, instantly through WhatsApp, iMessage, Instagram or email." },
      { q: "Can they reply to my bouquet?", a: "Your partner can react with an emoji and a short reply, and send a bouquet back with one tap." },
    ],
  },
  {
    slug: "apology",
    name: "Apology",
    emoji: "🥺",
    title: "Sorry Flowers – Send a Digital Apology Bouquet",
    metaDescription: "Say sorry with a digital apology bouquet. White roses, purple tulips and hydrangeas, plus a sincere note. Free and sent as a link.",
    answer:
      "The best flowers for an apology are white roses for a fresh start, purple tulips for admiration and hydrangeas for heartfelt understanding. A digital apology bouquet works best with a short, sincere note that names what you are sorry for, without excuses.",
    flowers: ["rose", "tulip", "hydrangea", "lavender"],
    preset: { stems: ["white-rose", "white-rose", "purple-tulip", "purple-tulip", "hydrangea", "lavender", "lavender", "babys-breath", "eucalyptus"], wrapper: "cream", ribbon: "lilac", background: "lilac" },
    messages: [
      "I'm sorry. You deserved better from me, and I'm working on it.",
      "No excuses, just sorry. Can we talk?",
      "I messed up. These flowers are the start, not the whole apology.",
      "I hate that I hurt you. I'm really sorry.",
      "Sorry for being a lot lately. I appreciate you more than I say.",
      "White roses = fresh start? Please? 🥺",
    ],
    faq: [
      { q: "What color roses say sorry?", a: "White roses are the traditional apology flower because they symbolize a fresh start and sincerity. Pink roses can also soften an apology between friends." },
      { q: "How do I write a good apology note?", a: "Keep it short, name what you did, skip the excuses, and say what you will do differently. The flowers set the tone; the note does the work." },
      { q: "Is a digital apology bouquet too casual?", a: "It depends on the situation. For small moments it is a sweet gesture; for bigger ones, use it to open a real conversation." },
    ],
  },
  {
    slug: "crush",
    name: "Crush",
    emoji: "🫶",
    title: "Flowers for Your Crush – Send a Cute Digital Bouquet",
    metaDescription: "Shoot your shot with a cute digital bouquet for your crush. Pink tulips, ranunculus and a playful note, shared as a link. Free.",
    answer:
      "A bouquet for a crush should feel sweet, not intense: pink tulips for care, ranunculus for \"you're charming\" and a sprig of forget-me-nots. Keep the note light and playful. A digital bouquet is a low-pressure way to show interest without an awkward in-person moment.",
    flowers: ["tulip", "ranunculus", "forget-me-not", "cosmos", "daisy"],
    preset: { stems: ["pink-tulip", "pink-tulip", "ranunculus", "peach-ranunculus", "cosmos", "forget-me-not", "daisy", "fern"], wrapper: "blush", ribbon: "pink", background: "blush" },
    messages: [
      "Not to be dramatic but you're kind of my favorite notification.",
      "Saw these and thought of you. That's it. That's the message.",
      "Ranunculus means \"you're charming.\" Just saying 🫶",
      "Coffee sometime? The flowers are a bribe.",
      "You make my day better and I thought you should know.",
      "Is this a lot? Maybe. Do I regret it? No.",
    ],
    faq: [
      { q: "Which flower says \"I like you\"?", a: "Pink tulips and ranunculus are sweet, light ways to say you like someone. Red roses are more intense and usually read as full-on romance." },
      { q: "Is it weird to send flowers to a crush?", a: "A small digital bouquet with a playful note is low pressure and usually lands as cute. Match the vibe of your conversations." },
      { q: "Can I send it anonymously?", a: "Yes. The \"from\" field is optional, so you can leave it blank or use a nickname." },
    ],
  },
  {
    slug: "friendship",
    name: "Best friend",
    emoji: "🌼",
    title: "Friendship Flowers – Digital Bouquet for Your Best Friend",
    metaDescription: "Send your best friend a digital bouquet: yellow roses, daisies and sunflowers for friendship. Free, cute and shared as a link.",
    answer:
      "Yellow roses are the classic friendship flower, and daisies and sunflowers add loyalty and fun. A digital friendship bouquet is perfect for Friendship Day, Galentine's, or a random Tuesday when your best friend needs to know they are appreciated.",
    flowers: ["rose", "daisy", "sunflower", "gerbera", "cosmos"],
    preset: { stems: ["yellow-rose", "yellow-rose", "sunflower", "daisy", "daisy", "gerbera", "cosmos", "babys-breath", "ruscus", "pampas"], wrapper: "news", ribbon: "gold", background: "butter" },
    messages: [
      "Thank you for being my emergency contact and my entertainment.",
      "Yellow roses = friendship. You = the best one.",
      "If we're not friends in the next life I'm leaving.",
      "Just a reminder that you're stuck with me forever 🌼",
      "Bestie appreciation post, but make it flowers.",
      "Thanks for being the Gayle to my Oprah.",
    ],
    faq: [
      { q: "What flower means friendship?", a: "Yellow roses mean friendship and joy. Daisies and sunflowers also carry loyal, cheerful meanings that suit best friends." },
      { q: "When is Friendship Day?", a: "International Friendship Day is July 30, and many countries including India and the US celebrate it on the first Sunday of August." },
      { q: "Can I send one bouquet to a group chat?", a: "Yes. Copy the link and paste it into any group chat. Everyone who opens it sees the bouquet bloom." },
    ],
  },
  {
    slug: "get-well",
    name: "Get well soon",
    emoji: "🩹",
    title: "Get Well Soon Flowers – Send a Digital Bouquet",
    metaDescription: "Send a get well soon digital bouquet with sunflowers, daisies and eucalyptus. A gentle, free way to say you're thinking of them.",
    answer:
      "Get well bouquets should feel light and hopeful: sunflowers for warmth, daisies for fresh starts and eucalyptus for healing. A digital get well bouquet is also allergy-free and hospital-friendly, since many wards do not allow real flowers.",
    flowers: ["sunflower", "daisy", "tulip", "eucalyptus", "gerbera"],
    preset: { stems: ["sunflower", "daisy", "daisy", "yellow-tulip", "gerbera", "white-cosmos", "eucalyptus", "eucalyptus", "fern"], wrapper: "sage", ribbon: "gold", background: "sage" },
    messages: [
      "Rest up. The world is less fun without you in it.",
      "Sending sunshine and zero germs. Get well soon!",
      "Hospital-approved flowers, because I checked 🩹",
      "Heal fast, I have gossip.",
      "Thinking of you and wishing you a quick recovery.",
      "Take it slow. We'll be here when you're back.",
    ],
    faq: [
      { q: "Are real flowers allowed in hospitals?", a: "Many hospitals, especially ICUs, restrict real flowers because of allergies and infection risk. A digital bouquet avoids that completely." },
      { q: "What flowers say get well soon?", a: "Sunflowers, daisies and yellow tulips are cheerful and hopeful. Eucalyptus is linked with healing." },
      { q: "Can I send it by email?", a: "Yes. Copy the link into any email, text or chat app." },
    ],
  },
  {
    slug: "graduation",
    name: "Graduation",
    emoji: "🎓",
    title: "Graduation Flowers – Digital Congratulations Bouquet",
    metaDescription: "Congratulate a graduate with a digital bouquet: sunflowers, stargazer lilies and gerberas for achievement. Free and sent as a link.",
    answer:
      "Graduation flowers celebrate achievement: stargazer lilies for ambition, sunflowers for pride and gerberas for joy. A digital graduation bouquet can be sent to a whole class group chat or timed to open right after the ceremony.",
    flowers: ["lily", "sunflower", "gerbera", "rose"],
    preset: { stems: ["stargazer-lily", "sunflower", "gerbera", "yellow-rose", "yellow-rose", "pink-gerbera", "babys-breath", "ruscus", "pampas"], wrapper: "noir", ribbon: "gold", background: "cream" },
    messages: [
      "You did that. Congratulations, graduate 🎓",
      "All those late nights paid off. So proud of you!",
      "Degree: unlocked. Next level: loading.",
      "The tassel was worth the hassle. Congrats!",
      "Can't wait to see what you do next.",
      "Officially smarter than me. Congratulations!",
    ],
    faq: [
      { q: "What flowers are best for graduation?", a: "Sunflowers, stargazer lilies and yellow roses are popular graduation flowers because they stand for pride, ambition and joy." },
      { q: "Can I schedule it for the ceremony?", a: "Yes, set an open time and the bouquet blooms at that moment." },
      { q: "Can I download the bouquet as an image?", a: "Yes. You can save it as a square image or an Instagram story." },
    ],
  },
  {
    slug: "mothers-day",
    name: "Mother's Day",
    emoji: "🌷",
    title: "Mother's Day Flowers – Send Mom a Digital Bouquet",
    metaDescription: "Send mom a digital Mother's Day bouquet with pink carnations, peonies and tulips. Write a note she'll keep. Free, no app needed.",
    answer:
      "Pink carnations are the traditional Mother's Day flower and stand for a mother's love. Peonies and pink tulips make the bouquet softer and fuller. A digital bouquet from Petalpost opens in any phone browser, so mom does not need to install anything.",
    flowers: ["carnation", "peony", "tulip", "rose", "lavender"],
    preset: { stems: ["pink-carnation", "pink-carnation", "peony", "pink-tulip", "pink-tulip", "pink-rose", "lavender", "babys-breath", "eucalyptus"], wrapper: "blush", ribbon: "ivory", background: "blush" },
    messages: [
      "Thank you for everything, especially the things I never noticed. Love you, Mom.",
      "Happy Mother's Day to the original main character 🌷",
      "Everything good in me started with you.",
      "Flowers that last as long as my gratitude.",
      "You're the best mom, and I'm not biased at all.",
      "Call me back when you see this 😂 Love you!",
    ],
    faq: [
      { q: "What is the traditional Mother's Day flower?", a: "The pink carnation. It was chosen by Anna Jarvis, who founded Mother's Day in the US, and it stands for a mother's love." },
      { q: "When is Mother's Day?", a: "In the US, India, Canada and Australia it is the second Sunday of May. In the UK it is the fourth Sunday of Lent." },
      { q: "Does mom need an app to open it?", a: "No. The bouquet opens in any web browser from a link." },
    ],
  },
  {
    slug: "valentines-day",
    name: "Valentine's Day",
    emoji: "💌",
    title: "Valentine's Day Digital Bouquet – Free Virtual Roses",
    metaDescription: "Send virtual roses for Valentine's Day. Build a free digital bouquet with red roses and tulips, add a love note and share a link.",
    answer:
      "Red roses are the definitive Valentine's flower, and red tulips say \"I declare my love.\" A digital Valentine's bouquet lets you send virtual roses instantly, schedule them to open on February 14, and attach a handwritten-style love note, all for free.",
    flowers: ["rose", "tulip", "peony", "carnation", "babys-breath"],
    preset: { stems: ["red-rose", "red-rose", "red-rose", "red-rose", "red-tulip", "red-tulip", "red-carnation", "babys-breath", "babys-breath", "fern"], wrapper: "noir", ribbon: "cherry", background: "blush" },
    messages: [
      "Roses are red, this bouquet is too, I'd send real ones but I'm broke. Love you 💌",
      "Be my valentine? (Correct answer: yes)",
      "Every day is Valentine's with you.",
      "I picked every flower myself. Digitally. It still counts.",
      "You + me = my favorite love story.",
      "Happy Valentine's to the person who owns my heart and my hoodie.",
    ],
    faq: [
      { q: "How do I send virtual roses?", a: "Open the Petalpost maker, add red roses, wrap them, write a note and tap send. You get a link to share anywhere." },
      { q: "How many roses should I send?", a: "Popular meanings: one rose for love at first sight, three for \"I love you\", and a dozen for \"be mine.\"" },
      { q: "Can I schedule it for February 14?", a: "Yes, set the open date to Valentine's Day and it will stay wrapped until then." },
    ],
  },
  {
    slug: "thank-you",
    name: "Thank you",
    emoji: "🙏",
    title: "Thank You Flowers – Send a Digital Gratitude Bouquet",
    metaDescription: "Say thank you with a digital bouquet of pink roses, hydrangeas and peach roses. Free, heartfelt and sent as a shareable link.",
    answer:
      "Pink and peach roses both mean gratitude, and hydrangeas stand for heartfelt thanks. A digital thank-you bouquet is a quick, thoughtful way to thank a teacher, coworker, host or friend, and it takes less than a minute to make.",
    flowers: ["rose", "hydrangea", "sunflower", "daisy"],
    preset: { stems: ["peach-rose", "peach-rose", "pink-rose", "hydrangea", "pink-hydrangea", "daisy", "babys-breath", "eucalyptus", "ruscus"], wrapper: "kraft", ribbon: "sage", background: "cream" },
    messages: [
      "Thank you for showing up for me. It meant everything.",
      "Small flowers, big thank you 🙏",
      "You made that so much easier. Thank you!",
      "Grateful for you, today and always.",
      "Consider this a bouquet-sized thank you.",
      "Thanks for being the best teacher/mentor/human.",
    ],
    faq: [
      { q: "Which flowers mean thank you?", a: "Pink roses, peach roses and hydrangeas all symbolize gratitude." },
      { q: "Is a digital bouquet appropriate for a coworker?", a: "Yes. It is a friendly, professional way to say thanks, and it can be shared in a work chat or email." },
      { q: "Do I need an account?", a: "No. You can make and send bouquets without signing up." },
    ],
  },
  {
    slug: "sympathy",
    name: "Sympathy",
    emoji: "🕊️",
    title: "Sympathy Flowers – A Gentle Digital Condolence Bouquet",
    metaDescription: "Send a gentle digital sympathy bouquet with white lilies, white roses and forget-me-nots to show you are thinking of someone.",
    answer:
      "White lilies are the traditional sympathy flower and represent peace and remembrance. White roses, forget-me-nots and eucalyptus keep a condolence bouquet gentle and calm. Pair it with a short, simple message; there is no perfect thing to say, only a caring one.",
    flowers: ["lily", "rose", "forget-me-not", "poppy"],
    preset: { stems: ["white-lily", "white-lily", "white-rose", "white-rose", "white-cosmos", "forget-me-not", "babys-breath", "eucalyptus", "eucalyptus"], wrapper: "cream", ribbon: "ivory", background: "sky" },
    messages: [
      "Thinking of you and holding you close in my heart.",
      "I'm so sorry for your loss. I'm here whenever you need me.",
      "Sending love, peace and strength to you and your family.",
      "No words, just love. I'm here.",
      "Remembering them with you today.",
      "You don't have to reply. I just want you to know I care.",
    ],
    faq: [
      { q: "What flowers are appropriate for sympathy?", a: "White lilies, white roses and forget-me-nots are traditional sympathy flowers representing peace, respect and remembrance." },
      { q: "What should I write in a sympathy note?", a: "Keep it simple and sincere: acknowledge the loss, share care, and offer support without expecting a reply." },
      { q: "Can I turn off the fun animations?", a: "The bouquet opens gently and respects your phone's reduced-motion setting." },
    ],
  },
  {
    slug: "congratulations",
    name: "Congratulations",
    emoji: "🎉",
    title: "Congratulations Flowers – Digital Bouquet for Big Wins",
    metaDescription: "Celebrate a new job, promotion or big win with a digital congratulations bouquet. Bright flowers, a note and a shareable link.",
    answer:
      "Congratulations bouquets should feel bold and celebratory: gerberas for cheer, sunflowers for success and stargazer lilies for ambition. A digital bouquet is perfect for new jobs, promotions, engagements, new homes and any win worth celebrating.",
    flowers: ["gerbera", "sunflower", "lily", "tulip", "poppy"],
    preset: { stems: ["gerbera", "gerbera", "sunflower", "stargazer-lily", "yellow-tulip", "coral-peony", "poppy", "pampas", "ruscus"], wrapper: "lilac", ribbon: "gold", background: "butter" },
    messages: [
      "Look at you go! Congratulations 🎉",
      "New job? New level. So proud of you.",
      "You earned every bit of this.",
      "Big win, bigger bouquet. Congrats!",
      "Told you so 😌 Congratulations!",
      "Celebrating you today and always.",
    ],
    faq: [
      { q: "What flowers say congratulations?", a: "Gerberas, sunflowers and stargazer lilies are cheerful, bold choices that celebrate achievement." },
      { q: "Can I send it to someone at work?", a: "Yes. Paste the link in Slack, Teams, email or any chat." },
      { q: "Can I see if they opened it?", a: "Yes. Your bouquets page shows how many times each bouquet was opened and any reactions." },
    ],
  },
];

export const OCCASION_BY_SLUG = new Map(OCCASIONS.map((o) => [o.slug, o]));
