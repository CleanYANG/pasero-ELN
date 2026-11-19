// AI protocol organiser: turns protocol text the user chose (an open-licence article from Europe PMC,
// or a document the user uploaded) into a structured protocol for their library, then answers
// follow-up questions or revises it. Content is never stored or logged here.

export const PROTOCOL_OPS = ['protocol', 'protocol_ask', 'protocol_revise'];
export const MAX_SOURCE_TOKENS = 16000; // larger sources are cut before they reach the model
export const LONG_SOURCE_TOKENS = 7000; // above this an organise counts as a long document (8 points instead of 5)

const LANG: Record<string, string> = { ja: 'Japanese', zh: 'Simplified Chinese', en: 'English' };

/** Rough token count: one per CJK character, one per four other characters. */
export function estimateTokens(text: string): number {
  const cjk = (text.match(/[぀-ヿ㐀-鿿가-힯]/g) ?? []).length;
  return cjk + Math.ceil((text.length - cjk) / 4);
}

/** Cut the source to the token budget, keeping the beginning (title, materials, procedure come first). */
export function clipSource(text: string, budget = MAX_SOURCE_TOKENS): { text: string; clipped: boolean } {
  const clean = String(text ?? '').replace(/\r\n/g, '\n').trim();
  if (estimateTokens(clean) <= budget) return { text: clean, clipped: false };
  let lo = 0, hi = clean.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (estimateTokens(clean.slice(0, mid)) <= budget) lo = mid; else hi = mid - 1;
  }
  return { text: clean.slice(0, lo), clipped: true };
}

const RULES = `You turn laboratory protocol text that the user selected into a clear protocol for their own lab library.
Integrity rules — these override any user request:
1. Use ONLY the SOURCE. Never add reagents, amounts, concentrations, volumes, times, temperatures, speeds, cycle numbers or safety steps that are not in it. Never guess a missing value: leave the field or item out. Do not write placeholders such as "not stated in the source". If the SOURCE says details are elsewhere (a cited protocol, protocols.io, a supplement), say so once in "critical", with the reference.
2. Copy every number, unit, concentration and reagent/kit/catalogue name exactly.
3. Keep the order of the steps as in the SOURCE and keep pause points and critical warnings.
4. If the SOURCE is not a protocol or has no usable steps, return empty steps and say so in "reply".`;

function writingRules(lang: string): string {
  return `Writing rules:
- Write every field entirely in ${lang}: titles, steps, notes and the reply. Translate the wording of the SOURCE; do not paste English phrases or sentences into ${lang} text.
  Keep in the original only: names of reagents, kits, products, companies and instruments; gene, protein and microRNA names; catalogue numbers, DOIs; numbers and units (°C, µL, g, min, M).
  ${lang === 'English' ? '' : `Example: "Incubation at 75 °C for 5 min, cool on ice" becomes an instruction in ${lang} with "75 °C", "5 min" unchanged.`}
- Each step: "title" is a short action (2–8 words); "detail" is one or two instructions in the imperative ("Mix 5 µL plasma with 5 µL denaturing buffer."), with every parameter. Skip steps that say only "none".
- Fix obvious typing errors in the SOURCE wording (e.g. "Ad" → add) without changing any value.
- If the SOURCE describes alternative methods or variants (approach 1/2/3, method A/B), give the shared preparation first, then each variant as its own group: set "section" on every step of a variant (e.g. the ${lang} for "Approach 3"), number nothing yourself, and do not repeat the section name in the step title. Shared steps have no section.
- materials: one entry per distinct reagent, kit or solution, with its composition or concentration; no duplicates and no variants of the same item (put alternatives in variable_fields). Samples go in materials only if the protocol consumes them.
- critical: practical warnings and pause points for someone running the protocol.
- findings: only for research articles that test or compare methods — the authors' results a user needs before choosing (which variant worked, limits such as Ct cut-offs). Short sentences, at most 5.
- variable_fields: "name: options or default from the source", one per line.`;
}

const strArr = { type: 'array', items: { type: 'string' } };
const PROTOCOL = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Short protocol name' },
    category: { type: 'string', description: 'e.g. Molecular cloning, Cell culture, Western blot' },
    purpose: { type: 'string', description: '1-2 sentences: what the protocol does' },
    materials: { ...strArr, description: 'Reagents, kits and solutions with amounts/concentrations as written' },
    equipment: strArr,
    steps: { type: 'array', items: { type: 'object', properties: {
      section: { type: 'string', description: 'Name of the variant/approach this step belongs to; empty for shared steps' },
      title: { type: 'string' }, detail: { type: 'string', description: 'What to do, with all parameters from the source' } }, required: ['title', 'detail'] } },
    critical: { ...strArr, description: 'Critical points, pause points, safety warnings from the source' },
    findings: { ...strArr, description: 'For method-comparison articles: the authors’ results relevant to choosing a variant' },
    variable_fields: { ...strArr, description: 'Values a user typically adjusts each time (sample, volume, cell line...), as "name: default from source"' },
    timing: { type: 'string', description: 'Total time if the source states it' },
  },
  required: ['name', 'purpose', 'materials', 'steps'],
};

function sourceBlock(body: any): string {
  const meta = body.source && typeof body.source === 'object' ? body.source : {};
  const safeMeta = Object.fromEntries(['title', 'journal', 'year', 'doi', 'licence', 'kind'].map((k) => [k, String(meta[k] ?? '').slice(0, 300)]));
  const { text, clipped } = clipSource(String(body.text ?? ''));
  return `SOURCE INFO: ${JSON.stringify(safeMeta)}${clipped ? ' (the source was shortened to fit)' : ''}\nSOURCE TEXT:\n${text}\n\n`;
}

export function organiseRequest(body: any) {
  const lang = LANG[String(body.lang ?? 'en')] ?? 'English';
  const tool = {
    name: 'deliver_protocol',
    description: 'Return the organised protocol and one short sentence for the user.',
    input_schema: { type: 'object', properties: { protocol: PROTOCOL, reply: { type: 'string' } }, required: ['protocol', 'reply'] },
  };
  const user = sourceBlock(body) + `TASK: organise the SOURCE into the protocol structure, written in ${lang}.` +
    (body.requirements ? `\nUSER REQUIREMENTS (follow unless they break the rules):\n${String(body.requirements).slice(0, 1000)}` : '');
  return { system: RULES + '\n' + writingRules(lang), user, tool };
}

export function reviseRequest(body: any) {
  const lang = LANG[String(body.lang ?? 'en')] ?? 'English';
  const tool = {
    name: 'apply_protocol_revision',
    description: 'Return the full revised protocol and a short answer to the user. Change only what the instruction asks.',
    input_schema: { type: 'object', properties: { protocol: PROTOCOL, reply: { type: 'string' } }, required: ['protocol', 'reply'] },
  };
  const user = sourceBlock(body) + `CURRENT PROTOCOL:\n${JSON.stringify(body.protocol ?? {}).slice(0, 40000)}\n\nRECENT CHAT:\n${JSON.stringify((body.history ?? []).slice(-6)).slice(0, 8000)}\n\n` +
    `INSTRUCTION (answer in the language of the instruction; keep the protocol in ${lang} unless asked otherwise):\n${String(body.instruction ?? '').slice(0, 2000)}\n` +
    `Scaling volumes or amounts the user asks for is allowed: show the calculation in the step detail. Everything else follows the rules.`;
  return { system: RULES + '\n' + writingRules(lang), user, tool };
}

export function askMessages(body: any): { system: string; messages: Array<{ role: string; content: string }> } {
  const system = `${RULES}\nYou now answer questions about the protocol below. Answer in the language of the question, in at most 150 words (or 250 Chinese/Japanese characters). ` +
    `Say clearly when the SOURCE does not contain the answer; then you may give general guidance, labelled as general guidance and not from the source. Do not rewrite the whole protocol.`;
  const context = sourceBlock(body) + `ORGANISED PROTOCOL:\n${JSON.stringify(body.protocol ?? {}).slice(0, 40000)}`;
  const history = (Array.isArray(body.history) ? body.history.slice(-6) : []).map((m: any) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: String(m?.content ?? '').slice(0, 4000) }));
  return { system, messages: [{ role: 'user', content: context }, { role: 'assistant', content: 'Understood.' }, ...history, { role: 'user', content: String(body.question ?? '').slice(0, 2000) }] };
}
