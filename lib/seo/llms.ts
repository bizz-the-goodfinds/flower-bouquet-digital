import { FLOWER_FAMILIES } from "@/lib/content/flowers";
import { GUIDES, SITE_FAQ } from "@/lib/content/guides";
import { OCCASIONS } from "@/lib/content/occasions";
import { absoluteUrl, site } from "@/lib/site";

export function llmsTxt() {
  return `# ${site.name}

> ${site.definition}

${site.name} lets anyone arrange hand-drawn flowers into a bouquet, add a personal note, and send it as a link that unwraps and blooms on the recipient's phone. It is free, needs no account or app, and supports scheduled reveals, a link preview that shows only a sealed envelope (the flowers stay a surprise), image/story/video/GIF downloads, personal links for sending one bouquet to several people, emoji reactions with a private sender–recipient chat, "send one back" replies grouped into threads, and a My bouquets page with sent and received bouquets.

Notes can carry a song card (Spotify, YouTube or Apple Music link, played only when tapped) and a voice note of up to a minute. An optional AI note writer ("Help me write") suggests three drafts in a chosen tone using the sender's own AI key (Google Gemini, OpenAI, Anthropic or OpenRouter); the key stays in the browser and the site never pays for or sees AI requests. My bouquets shows a weekly sending streak, badges and how many people sent flowers after opening yours. The site installs as an app (PWA) and can send push notifications when a bouquet is opened, answered or unlocks.

## Product
- [Bouquet maker](${absoluteUrl("/create")}): build and send a digital bouquet
- [FAQ](${absoluteUrl("/faq")}): pricing, privacy, sharing, scheduling
- [AI note writer setup](${absoluteUrl("/guides/ai-note-writer-api-key")}): get a free Gemini key or connect OpenAI, Anthropic or OpenRouter
- [About](${absoluteUrl("/about")})

## Occasions
${OCCASIONS.map((o) => `- [${o.name}](${absoluteUrl(`/occasions/${o.slug}`)}): ${o.answer.split(". ")[0].replace(/\.+$/, "")}.`).join("\n")}

## Flower meanings
${FLOWER_FAMILIES.map((f) => `- [${f.name}](${absoluteUrl(`/flowers/${f.slug}`)}): ${f.answer.split(". ")[0].replace(/\.+$/, "")}.`).join("\n")}

## Guides
${GUIDES.map((g) => `- [${g.title}](${absoluteUrl(`/guides/${g.slug}`)})`).join("\n")}

## Optional
- [Full text for LLMs](${absoluteUrl("/llms-full.txt")})
`;
}

export function llmsFullTxt() {
  const faq = (items: { q: string; a: string }[]) => items.map((f) => `**${f.q}**\n${f.a}`).join("\n\n");
  return `# ${site.name} – full reference

> ${site.definition}

${site.description}

## Frequently asked questions
${faq(SITE_FAQ)}

## Flower meanings
${FLOWER_FAMILIES.map(
  (f) => `### ${f.name}
Source: ${absoluteUrl(`/flowers/${f.slug}`)}

${f.answer}
${f.colors ? `\n${f.colors.map((c) => `- ${c.color}: ${c.meaning}`).join("\n")}\n` : ""}
Best for: ${f.occasions.join(", ")}.

${faq(f.faq)}`,
).join("\n\n")}

## Occasions
${OCCASIONS.map(
  (o) => `### ${o.name}
Source: ${absoluteUrl(`/occasions/${o.slug}`)}

${o.answer}

Message ideas:
${o.messages.map((m) => `- "${m}"`).join("\n")}

${faq(o.faq)}`,
).join("\n\n")}

## Guides
${GUIDES.map(
  (g) => `### ${g.title}
Source: ${absoluteUrl(`/guides/${g.slug}`)}

${g.answer}
${g.howTo ? `\n${g.howTo.map((s, i) => `${i + 1}. ${s.name}: ${s.text}`).join("\n")}\n` : ""}
${g.sections.map((s) => `#### ${s.heading}\n${s.body.join("\n\n")}${s.list ? `\n${s.list.map((l) => `- ${l}`).join("\n")}` : ""}`).join("\n\n")}`,
).join("\n\n")}
`;
}
