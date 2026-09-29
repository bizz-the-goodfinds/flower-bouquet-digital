export type GuideSection = { heading: string; body: string[]; list?: string[] };

export type Guide = {
  slug: string;
  title: string;
  metaDescription: string;
  answer: string;
  published: string;
  updated: string;
  howTo?: { name: string; text: string }[];
  sections: GuideSection[];
  faq: { q: string; a: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-send-a-digital-bouquet",
    title: "How to Send a Digital Flower Bouquet (Free, in 1 Minute)",
    metaDescription: "Step-by-step: how to make and send a free digital flower bouquet with a personal note. Works on WhatsApp, Instagram, iMessage and email.",
    answer:
      "To send a digital bouquet, open the Flower Bouquet Digital maker, tap flowers to add them, pick a wrapper and ribbon, write a note on the card, then tap Send. You get a short link to share on WhatsApp, Instagram, iMessage or email. It is free and needs no signup or app.",
    published: "2026-09-29",
    updated: "2026-09-29",
    howTo: [
      { name: "Open the bouquet maker", text: "Go to the Flower Bouquet Digital maker or pick an occasion preset to start with a ready-made bouquet." },
      { name: "Add and arrange flowers", text: "Tap flowers and greenery to add them. Drag to move, pinch or use the toolbar to resize and rotate, or tap Shuffle to auto-arrange." },
      { name: "Choose wrapper, ribbon and background", text: "Pick a wrap (cone, tissue, layered, sleeve, basket, hat box, vase or mason jar), a paper color or print, a ribbon and a background that fits the mood." },
      { name: "Write your card", text: "Add who it is for, who it is from, and a message. Pick a handwriting style. Optionally set a date and time for it to open." },
      { name: "Send the link", text: "Tap Send to get your link. Share it on WhatsApp, Instagram, iMessage, email, or download it as an image or story." },
    ],
    sections: [
      {
        heading: "What is a digital flower bouquet?",
        body: [
          "A digital flower bouquet is an illustrated bouquet you arrange online and send as a link or image instead of physical flowers. The recipient opens it on their phone and watches it unwrap and bloom, then reads your note.",
          "Digital bouquets are free, instant, allergy-free, pet-safe and they never wilt, which is why they have become a popular way to send flowers across distances.",
        ],
      },
      {
        heading: "Where can I share a digital bouquet?",
        body: ["Anywhere you can paste a link. The link shows a preview image of your actual bouquet in most apps."],
        list: ["WhatsApp and WhatsApp status", "Instagram DMs and Stories (download the 9:16 story image)", "iMessage and SMS", "Snapchat, Telegram, Discord", "Email, Slack or Microsoft Teams"],
      },
      {
        heading: "Tips for a bouquet that looks great",
        body: [],
        list: [
          "Use 5 to 9 flowers plus 2 greenery sprigs for a full but clean look.",
          "Put your biggest flower slightly off-center.",
          "Mix one bold color with one soft color, then add white filler like baby's breath.",
          "Match the flower meaning to the occasion (see the flower meaning guides).",
          "Keep the note short and specific; one real sentence beats a long generic one.",
        ],
      },
    ],
    faq: [
      { q: "Is Flower Bouquet Digital free?", a: "Yes, completely free. No account or app is needed to send or open a bouquet." },
      { q: "Does the recipient need an app?", a: "No. The bouquet opens in any mobile or desktop browser." },
      { q: "Can I schedule a bouquet?", a: "Yes. Set an open date and time on the card; the link shows a countdown until then." },
      { q: "Can I delete a bouquet after sending?", a: "Yes. From the My bouquets page on the same device (or on any device while signed in), you can delete any bouquet you sent." },
      { q: "Does the link preview spoil the surprise?", a: "No. When you paste the link into WhatsApp, iMessage or Instagram, the preview shows only your sealed envelope and who it's from. The flowers stay hidden until they tap to open it." },
    ],
  },
  {
    slug: "flower-color-meanings",
    title: "Flower Color Meanings: What Each Color Says",
    metaDescription: "A quick guide to flower color meanings: red for love, pink for gratitude, white for new beginnings, yellow for friendship, purple for admiration and more.",
    answer:
      "In the language of flowers, red means love and passion, pink means gratitude and gentle affection, white means purity and new beginnings, yellow means friendship and joy, orange means enthusiasm, purple means admiration, and blue means calm and trust.",
    published: "2026-09-29",
    updated: "2026-09-29",
    sections: [
      {
        heading: "Flower colors and their meanings",
        body: ["Floriography, the language of flowers, became popular in the Victorian era as a way to send coded messages. Color is the quickest way to read a bouquet:"],
        list: [
          "Red: romantic love, passion, courage",
          "Pink: gratitude, admiration, sweetness",
          "White: purity, sympathy, new beginnings, apology",
          "Yellow: friendship, joy, optimism",
          "Orange: enthusiasm, energy, warmth",
          "Purple: admiration, royalty, success",
          "Blue: calm, trust, understanding",
          "Green: renewal, health, harmony",
        ],
      },
      {
        heading: "How to combine colors in a bouquet",
        body: [
          "Pick one main color that carries your message, add a softer supporting color, and finish with white filler and greenery. For example, red roses with blush peonies and baby's breath say romance, while yellow roses with daisies and eucalyptus say friendship.",
        ],
      },
    ],
    faq: [
      { q: "What color flowers mean friendship?", a: "Yellow. Yellow roses, sunflowers and daisies are classic friendship flowers." },
      { q: "What color flowers mean sorry?", a: "White flowers, especially white roses, and blue hydrangeas are used to apologize." },
      { q: "What color flowers mean love?", a: "Red, especially red roses and red tulips." },
    ],
  },
  {
    slug: "digital-flowers-vs-real-flowers",
    title: "Digital Flowers vs Real Flowers: When Each Makes Sense",
    metaDescription: "Digital flower bouquets vs real flowers: cost, speed, sustainability and when a digital bouquet is the better gift.",
    answer:
      "Digital flowers are free, instant, never wilt and have almost no environmental footprint, so they are best for long distance, last-minute or everyday moments. Real flowers are best for big in-person occasions. Many people send a digital bouquet first and real flowers for milestones.",
    published: "2026-09-29",
    updated: "2026-09-29",
    sections: [
      {
        heading: "Why send digital flowers?",
        body: [],
        list: [
          "Free: no delivery fees or minimum orders.",
          "Instant: arrives in seconds anywhere in the world.",
          "Never wilts: the link and image last.",
          "Allergy- and pet-safe: no pollen, no toxic lilies for cats.",
          "Lower footprint: no refrigerated shipping or plastic wrapping.",
          "Personal: you arrange every stem yourself and write the note.",
        ],
      },
      {
        heading: "When real flowers are better",
        body: [
          "For weddings, funerals, first dates and big anniversaries, many people still expect physical flowers. A digital bouquet can complement them: send it in the morning, and let the real ones arrive later.",
        ],
      },
    ],
    faq: [
      { q: "Are digital flowers a real gift?", a: "Yes. The effort is in the arrangement and the note, and many people keep the image or link as a keepsake." },
      { q: "Are digital flowers eco-friendly?", a: "They have a tiny footprint compared with cut flowers, which are often grown in greenhouses and shipped by air." },
    ],
  },
];

export const GUIDE_BY_SLUG = new Map(GUIDES.map((g) => [g.slug, g]));

export const SITE_FAQ: { q: string; a: string }[] = [
  { q: "What is Flower Bouquet Digital?", a: "Flower Bouquet Digital is a free online tool for making and sending digital flower bouquets with a personal note, shared as a link." },
  { q: "Is it really free?", a: "Yes. Making, sending and opening bouquets is free, with no account and no app required." },
  { q: "How does the recipient open the bouquet?", a: "They tap the link. It opens in any browser, the bouquet unwraps and blooms, and then your card appears." },
  { q: "Can I schedule a bouquet for a specific time?", a: "Yes. Set an open date and time and the link will show a countdown until the bouquet blooms." },
  { q: "Can I share it on Instagram or WhatsApp?", a: "Yes. Share the link directly to WhatsApp or any app, or download a square image or a 9:16 story image for Instagram and TikTok." },
  { q: "Is my message private?", a: "Bouquet links are unlisted and hidden from search engines. Only people with the link can see it, and you can delete it any time from the same device." },
  { q: "Can the recipient reply?", a: "Yes. They can react with an emoji and chat with you right under the bouquet, and send a bouquet back with one tap. You see their reactions and can reply from My bouquets." },
  { q: "Can I send one bouquet to several people?", a: "Yes. Create a personal link for each person. Each one sees their own name on the envelope, and you see who opened it and chat with each person separately." },
  { q: "Where do bouquets I receive go?", a: "Once you open a bouquet, it appears under My bouquets → Received, with your chat and a Send one back button. Sign in to see them on every device." },
  { q: "Can I preview my bouquet without it counting as opened?", a: "Yes. Tap Preview in My bouquets to replay exactly what they see. Your own previews never count as opens." },
  { q: "Do I need to sign up?", a: "No. Your sent and received bouquets are saved on your device under My bouquets. Signing in is optional and only syncs them across devices." },
];
