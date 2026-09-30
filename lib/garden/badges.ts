/** "Your garden" stats and badges. Shared by the stats API and My bouquets. */

export type GardenStats = {
  sent: number;
  opens: number;
  /** Weeks in a row (ending this week or last) with at least one bouquet sent. */
  streak: number;
  bestStreak: number;
  sentThisWeek: boolean;
  /** Bouquets sent back to you plus chat replies from recipients. */
  replies: number;
  /** Most bouquets in one send-one-back thread you're part of. */
  deepestThread: number;
  occasionsUsed: number;
  occasionsTotal: number;
  voiceNotes: number;
  songs: number;
  /** People who sent a bouquet after opening one of yours. */
  referrals: number;
};

export type BadgeId =
  | "first_bouquet"
  | "sent_5"
  | "sent_25"
  | "sent_100"
  | "first_reply"
  | "thread_5"
  | "every_occasion"
  | "first_voice"
  | "first_song";

export type Badge = { id: BadgeId; name: string; emoji: string; hint: string; done: string; earned: (s: GardenStats) => boolean };

export const BADGES: Badge[] = [
  { id: "first_bouquet", name: "First bloom", emoji: "🌱", hint: "Send your first bouquet", done: "You sent your first bouquet", earned: (s) => s.sent >= 1 },
  { id: "sent_5", name: "Posy", emoji: "💐", hint: "Send 5 bouquets", done: "You've sent 5 bouquets", earned: (s) => s.sent >= 5 },
  { id: "sent_25", name: "Florist", emoji: "🌷", hint: "Send 25 bouquets", done: "You've sent 25 bouquets", earned: (s) => s.sent >= 25 },
  { id: "sent_100", name: "Flower field", emoji: "🌻", hint: "Send 100 bouquets", done: "You've sent 100 bouquets", earned: (s) => s.sent >= 100 },
  { id: "first_reply", name: "Pen pal", emoji: "💌", hint: "Get your first reply", done: "Someone wrote back", earned: (s) => s.replies >= 1 },
  { id: "thread_5", name: "Back and forth", emoji: "🔁", hint: "Be part of a thread 5 bouquets deep", done: "A thread 5 bouquets deep", earned: (s) => s.deepestThread >= 5 },
  { id: "every_occasion", name: "For every season", emoji: "🗓️", hint: "Use every occasion once", done: "Every occasion, covered", earned: (s) => s.occasionsTotal > 0 && s.occasionsUsed >= s.occasionsTotal },
  { id: "first_voice", name: "Said it out loud", emoji: "🎙️", hint: "Send a voice note", done: "You sent a voice note", earned: (s) => s.voiceNotes >= 1 },
  { id: "first_song", name: "Mixtape", emoji: "🎶", hint: "Attach a song", done: "You sent a song", earned: (s) => s.songs >= 1 },
];

export const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));

/** Monday-based week number since the epoch, in UTC. */
export const weekIndex = (d: Date) => Math.floor((d.getTime() / 86_400_000 + 3) / 7);

/** Current and best weekly streaks from bouquet send times. A streak survives until a whole week passes without one. */
export function streaks(dates: Date[], now = new Date()) {
  const weeks = [...new Set(dates.map(weekIndex))].sort((a, b) => b - a);
  const thisWeek = weekIndex(now);
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const w of weeks) {
    run = prev !== null && prev - w === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = w;
  }
  let current = 0;
  if (weeks.length && thisWeek - weeks[0] <= 1) {
    current = 1;
    for (let i = 1; i < weeks.length && weeks[i - 1] - weeks[i] === 1; i++) current++;
  }
  return { current, best, sentThisWeek: weeks[0] === thisWeek };
}
