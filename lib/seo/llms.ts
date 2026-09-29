import { FLOWER_FAMILIES } from "@/lib/content/flowers";
import { GUIDES, SITE_FAQ } from "@/lib/content/guides";
import { OCCASIONS } from "@/lib/content/occasions";
import { absoluteUrl, site } from "@/lib/site";

export function llmsTxt() {
  return `# ${site.name}

> ${site.definition}

${site.name} lets anyone arrange hand-drawn flowers into a bouquet, add a personal note, and send it as a link that unwraps and blooms on the recipient's phone. It is free, needs no account or app, supports scheduled reveals, image/story downloads, emoji reactions and "send one back" replies.

## Product
- [Bouquet maker](${absoluteUrl("/create")}): build and send a digital bouquet
- [FAQ](${absoluteUrl("/faq")}): pricing, privacy, sharing, scheduling
- [About](${absoluteUrl("/about")})

## Occasions
${OCCASIONS.map((o) => `- [${o.name}](${absoluteUrl(`/occasions/${o.slug}`)}): ${o.answer.split(". ")[0]}.`).join("\n")}

## Flower meanings
${FLOWER_FAMILIES.map((f) => `- [${f.name}](${absoluteUrl(`/flowers/${f.slug}`)}): ${f.answer.split(". ")[0]}.`).join("\n")}

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
