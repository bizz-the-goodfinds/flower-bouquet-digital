import { z } from "zod";
import { designSchema } from "./composition";
import { OCCASION_BY_SLUG } from "../content/occasions";

export const CARD_TEMPLATES = {
  paper: { name: "Paper", bg: "#FFFDF8", ink: "#2B2420", accent: "#E8553E" },
  blush: { name: "Blush", bg: "#FCE4EC", ink: "#5A2335", accent: "#D6336C" },
  sage: { name: "Sage", bg: "#E6EFE1", ink: "#26351F", accent: "#5F8A52" },
  lilac: { name: "Lilac", bg: "#EEE8FC", ink: "#2F2552", accent: "#7B61C9" },
  butter: { name: "Butter", bg: "#FDF3CF", ink: "#4A3A0C", accent: "#C9901A" },
  night: { name: "Night", bg: "#24203A", ink: "#F6EFFF", accent: "#F4A6C0" },
} as const;

/** CSS variable names are set by next/font in app/(app)/layout.tsx */
export const CARD_FONTS = {
  caveat: { name: "Scribble", css: "var(--font-caveat)", scale: 1.35 },
  reenie: { name: "Pencil", css: "var(--font-reenie)", scale: 1.5 },
  dancing: { name: "Script", css: "var(--font-dancing)", scale: 1.2 },
  serif: { name: "Classic", css: "var(--font-display)", scale: 1.2 },
  mono: { name: "Typed", css: "var(--font-mono)", scale: 0.9 },
} as const;

export const STICKERS = ["💖", "🌸", "✨", "🦋", "🍓", "🎀", "🌈", "⭐", "🧸", "🍰", "🫶", "🔥"] as const;
export const MAX_STICKERS = 3;

export const EXPIRY_OPTIONS = {
  never: { name: "Forever", days: null },
  "30d": { name: "30 days", days: 30 },
  "7d": { name: "7 days", days: 7 },
  "24h": { name: "24 hours", days: 1 },
} as const;
export type Expiry = keyof typeof EXPIRY_OPTIONS;

export type CardTemplate = keyof typeof CARD_TEMPLATES;
export type CardFont = keyof typeof CARD_FONTS;

export const cardStyleSchema = z.object({
  template: z.enum(Object.keys(CARD_TEMPLATES) as [CardTemplate, ...CardTemplate[]]),
  font: z.enum(Object.keys(CARD_FONTS) as [CardFont, ...CardFont[]]),
  stickers: z.array(z.enum(STICKERS)).max(MAX_STICKERS).default([]),
});
export type CardStyle = z.infer<typeof cardStyleSchema>;

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ""));

export const createBouquetSchema = z.object({
  design: designSchema,
  card: z.object({
    to: text(60),
    from: text(60),
    message: text(500),
    style: cardStyleSchema,
  }),
  occasion: z
    .string()
    .optional()
    .nullable()
    .refine((s) => !s || OCCASION_BY_SLUG.has(s)),
  revealAt: z.string().datetime({ offset: true }).optional().nullable(),
  replyTo: z.string().regex(/^[A-Za-z0-9_-]{6,16}$/).optional().nullable(),
  expiry: z.enum(Object.keys(EXPIRY_OPTIONS) as [Expiry, ...Expiry[]]).default("never"),
  turnstileToken: z.string().max(4096).optional().nullable(),
  /** Honeypot: real users never fill this */
  website: z.string().max(0).optional(),
});

export type CreateBouquetInput = z.infer<typeof createBouquetSchema>;

export const REACTIONS = ["💐", "🥹", "😭", "❤️‍🔥", "🫶", "😂", "🌸", "✨"] as const;
