// Pasero Reporter — Supabase Edge Function.
// Text understanding & organisation: OpenAI GPT (default), DeepSeek or Anthropic Claude — chosen by REPORTER_TEXT_PROVIDER.
// No silent fallback between providers, so material only ever goes to the provider stated in the privacy notice.
// Schematic images: OpenAI Images API (GPT Image); disabled automatically when no OpenAI key is set.
// The browser never learns which models are used; provider keys live only in function secrets.
// Content of requests is never stored or logged — only counts, timings and success flags.

import { createClient } from 'npm:@supabase/supabase-js@2';

const env = (k: string, d = '') => Deno.env.get(k) ?? d;
const TEXT_PROVIDER = env('REPORTER_TEXT_PROVIDER', 'openai'); // openai | deepseek | anthropic
const ANTHROPIC_KEY = env('ANTHROPIC_API_KEY');
const DEEPSEEK_KEY = env('DEEPSEEK_API_KEY');
const OPENAI_KEY = env('OPENAI_API_KEY');
const DEFAULT_TEXT_MODEL: Record<string, string> = { openai: 'gpt-5.5', deepseek: 'deepseek-v4-pro', anthropic: 'claude-sonnet-5-5' };
const TEXT_MODEL = env('REPORTER_TEXT_MODEL', DEFAULT_TEXT_MODEL[TEXT_PROVIDER] ?? 'gpt-5.5');
const REASONING_EFFORT = env('REPORTER_REASONING_EFFORT', 'low');
const IMAGES_ENABLED = !!OPENAI_KEY;
const IMAGE_MODEL = env('REPORTER_IMAGE_MODEL', 'gpt-image-2');
const IMAGE_QUALITY = env('REPORTER_IMAGE_QUALITY', 'medium');
const LIMITS: Record<string, number> = {
  plan: +env('REPORTER_LIMIT_PLAN', '5'),
  revise: +env('REPORTER_LIMIT_REVISE', '40'),
  image: +env('REPORTER_LIMIT_IMAGE', '10'),
};
const ORIGINS = env('REPORTER_ALLOWED_ORIGINS', 'https://reporter.pasero.app,http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean);
const MAX_BODY = 600_000;
const TRIAL_START = env('REPORTER_TRIAL_START', '2026-10-30T00:00:00+09:00');
const TRIAL_END = env('REPORTER_TRIAL_END', '2027-01-11T00:00:00+09:00');

const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

/* ------------------------------------------------------------------ */
/* HTTP helpers                                                        */
/* ------------------------------------------------------------------ */
function cors(origin: string | null) {
  // listed origins + this project's Vercel preview URLs
  const ok = !!origin && (ORIGINS.includes(origin) || /^https:\/\/pasero-reporter[\w-]*\.vercel\.app$/.test(origin));
  const allow = ok ? origin! : ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}
class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) { super(message ?? code); }
}

/* ------------------------------------------------------------------ */
/* Scientific rules (prompt layer). Code-layer guards are below.      */
/* ------------------------------------------------------------------ */
const LANG: Record<string, string> = { ja: 'Japanese', zh: 'Simplified Chinese', en: 'English' };
const lim = (lang: string, cjk: number, en: number) => (lang === 'en' ? `≤ ${en} words` : `≤ ${cjk} characters`);

const SCIENCE_RULES = `You help researchers in the life sciences turn THEIR OWN selected material into a talk or a poster.
Scientific integrity rules — these override any user request:
1. Use ONLY information present in the MATERIAL. Do not add facts, background knowledge, numbers, statistics, sample sizes, gene/protein names, mechanisms or conclusions that are not in it. If something is missing, leave it out — never guess.
2. Never strengthen claims. "associated/correlated" must not become "causes"; "suggests" must not become "demonstrates". Keep hedging as written.
3. Copy numbers, units, p-values, n and gene/protein notation exactly as written in the MATERIAL.
4. Result figures are the authors' originals. Refer to them only by the given figure ids (e.g. "F2"), and only where that figure's caption supports the point. Never describe a result that no passage or caption states.
5. You may propose up to 3 conceptual SCHEMATICS (model, workflow, study design, background concept). A schematic must only depict entities and relationships explicitly named in the MATERIAL. Schematics never show data, charts, plots, images of experiments, blots, gels or micrographs.
6. For every slide or section, list in "sources" the passage ids (e.g. "b12") that support it.
7. If the user's requirements conflict with these rules, follow these rules and say so briefly in "reply".`;

const AUD: Record<string, string> = {
  specialist: 'specialists in the same field: skip textbook background, focus on data and what is new',
  adjacent: 'researchers from neighbouring fields: define key terms and methods briefly',
  general: 'students or non-specialists: explain background and why it matters, minimise jargon',
};
const PPT_TPL: Record<string, string> = {
  conference: 'conference talk: one claim per slide, figure-led, assertion–evidence titles',
  seminar: 'lab meeting / progress report: denser slides are fine, include method details and open questions',
  lecture: 'teaching: fewer words per slide, more "section" slides, explain step by step',
};
const POSTER_TPL: Record<string, string> = {
  classic: 'classic multi-column poster: balanced sections in reading order',
  centerfig: 'centre-figure poster: exactly one section with "emphasis": true holds the key result and its figure; keep other sections short',
  billboard: 'billboard poster: the headline carries the main finding in plain words; keep every section very short',
};
const DENSITY: Record<string, string> = { concise: '1–2 bullets per section', standard: '2–3 bullets per section', detailed: '3–4 bullets per section' };

function taskPrompt(s: any): string {
  const L = LANG[s.lang] ?? 'English';
  if (s.kind === 'ppt') {
    const n = Math.max(5, Math.round((+s.minutes || 10) * 0.9));
    return `OUTPUT: academic talk slides in ${L}.
- Template: ${PPT_TPL[s.template] ?? PPT_TPL.conference}.
- About ${n} slides for a ${s.minutes}-minute talk. Slide 1 layout "title" (title = paper title; bullets = [authors, affiliation]). Last slide layout "conclusion".
- Result slide titles: one short complete sentence stating the finding, ${lim(s.lang, 36, 14)}. Max 4 bullets per slide, each ${lim(s.lang, 34, 14)}.
- Give each key result figure its own slide ("figure" or "figure_bullets"); use each figure at most once. A schematic may appear on a "figure" slide via "schematic_id".
- Audience: ${AUD[s.audience] ?? AUD.specialist}.
- ${s.speaker_notes ? `Speaker notes in ${L}: what to say, about ${Math.round((+s.minutes || 10) * 60 / n)} seconds of natural spoken language per slide.` : 'Leave notes empty.'}`;
  }
  return `OUTPUT: academic conference poster in ${L}, ${s.orientation}, read from 1–2 m in about 3 minutes.
- Template: ${POSTER_TPL[s.template] ?? POSTER_TPL.classic}.
- "headline": the single main finding, ${lim(s.lang, 40, 18)}.
- "sections" in reading order: typically Background, Question/Aim, Approach, 2–4 Results (each with its figure), Conclusion. Short headings. ${DENSITY[s.density] ?? DENSITY.standard}, each ${lim(s.lang, 40, 16)}.
- Results should take most of the space. "emphasis": true only for the single most important result.
- "take_home": 1–3 short points.`;
}

/* ------------------------------------------------------------------ */
/* Tool schemas (forced structured output)                            */
/* ------------------------------------------------------------------ */
const strArr = { type: 'array', items: { type: 'string' } };
const STRUCTURE = {
  type: 'object',
  properties: {
    title: { type: 'string' }, short_title: { type: 'string' }, authors: { type: 'string' }, affiliation: { type: 'string' },
    research_question: { type: 'string' },
    key_results: { type: 'array', items: { type: 'object', properties: { claim: { type: 'string' }, evidence: { type: 'string' }, figure_ids: strArr, sources: strArr }, required: ['claim'] } },
    conclusion: { type: 'string' }, limitations: strArr,
  },
  required: ['title', 'short_title'],
};
const SCHEMATICS = { type: 'array', maxItems: 3, items: { type: 'object', properties: { id: { type: 'string', description: 'S1, S2, S3' }, title: { type: 'string' }, description: { type: 'string', description: 'What to draw: only entities and relations named in the material; short labels to show.' } }, required: ['id', 'title', 'description'] } };
const POSTER = {
  type: 'object',
  properties: {
    headline: { type: 'string' }, take_home: strArr,
    sections: { type: 'array', items: { type: 'object', properties: { heading: { type: 'string' }, bullets: strArr, figure_ids: strArr, schematic_ids: strArr, emphasis: { type: 'boolean' }, sources: strArr }, required: ['heading', 'bullets'] } },
  },
  required: ['headline', 'sections', 'take_home'],
};
const SLIDES = {
  type: 'object',
  properties: {
    slides: { type: 'array', items: { type: 'object', properties: { layout: { type: 'string', enum: ['title', 'section', 'bullets', 'figure', 'figure_bullets', 'conclusion'] }, title: { type: 'string' }, bullets: strArr, figure_id: { type: 'string' }, schematic_id: { type: 'string' }, notes: { type: 'string' }, sources: strArr }, required: ['layout', 'title', 'bullets'] } },
  },
  required: ['slides'],
};
const PATCH = { type: 'object', properties: { posterTemplate: { type: 'string', enum: ['classic', 'centerfig', 'billboard'] }, pptTemplate: { type: 'string', enum: ['conference', 'seminar', 'lecture'] }, palette: { type: 'string', enum: ['pasero', 'blue', 'forest', 'mono'] }, posterSize: { type: 'string', enum: ['A0P', 'A0L', 'A1P', 'A1L', 'U48P', 'U48L'] }, density: { type: 'string', enum: ['concise', 'standard', 'detailed'] } } };

function deliverTool(kind: string) {
  return {
    name: 'deliver_report',
    description: 'Return the content structure, the laid-out report content, suggested schematics and a one-sentence reply to the user.',
    input_schema: { type: 'object', properties: { structure: STRUCTURE, report: kind === 'ppt' ? SLIDES : POSTER, schematics: SCHEMATICS, reply: { type: 'string' } }, required: ['structure', 'report', 'schematics', 'reply'] },
  };
}
function reviseTool(kind: string) {
  return {
    name: 'apply_revision',
    description: 'Return the full revised report. Change only what the instruction asks; keep everything else identical. Use settings_patch only for layout requests (template, colours, size/orientation, text amount).',
    input_schema: { type: 'object', properties: { report: kind === 'ppt' ? SLIDES : POSTER, schematics: SCHEMATICS, settings_patch: PATCH, reply: { type: 'string', description: 'Short answer to the user, in the language of their instruction.' } }, required: ['report', 'reply'] },
  };
}

async function claude(system: string, user: string, tool: any): Promise<any> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: TEXT_MODEL, max_tokens: 12000, temperature: 0.3, system, messages: [{ role: 'user', content: user }], tools: [tool], tool_choice: { type: 'tool', name: tool.name } }),
  });
  if (!r.ok) { console.error('text upstream', r.status); throw new HttpError(502, 'UPSTREAM', 'AI service unavailable (' + r.status + ')'); }
  const j = await r.json();
  const block = (j.content ?? []).find((b: any) => b.type === 'tool_use');
  if (!block) throw new HttpError(502, 'UPSTREAM', 'Empty AI response');
  return block.input;
}

// DeepSeek: OpenAI-compatible chat completions in JSON mode. The tool's JSON Schema is given in the
// system prompt and the result is checked for required keys; one retry on malformed output.
async function deepseek(system: string, user: string, tool: any): Promise<any> {
  const sys = `${system}\n\nRespond with ONE json object only (no prose, no code fences) that conforms to this JSON Schema (${tool.description}):\n${JSON.stringify(tool.input_schema)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + DEEPSEEK_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ model: TEXT_MODEL, temperature: 0.3, max_tokens: 12000, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] }),
    });
    if (!r.ok) { console.error('text upstream', r.status); throw new HttpError(502, 'UPSTREAM', 'AI service unavailable (' + r.status + ')'); }
    const j = await r.json();
    const txt = String(j.choices?.[0]?.message?.content ?? '').replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try {
      const out = JSON.parse(txt);
      if ((tool.input_schema.required ?? []).every((k: string) => k in out)) return out;
    } catch (_) { /* retry */ }
  }
  throw new HttpError(502, 'UPSTREAM', 'AI returned an invalid result, please try again');
}
// OpenAI: Responses API with a forced function call; the call's arguments are the structured result.
async function gpt(system: string, user: string, tool: any): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + OPENAI_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: TEXT_MODEL, instructions: system, input: user, store: false,
        reasoning: { effort: REASONING_EFFORT }, max_output_tokens: 24000,
        tools: [{ type: 'function', name: tool.name, description: tool.description, parameters: tool.input_schema, strict: false }],
        tool_choice: { type: 'function', name: tool.name },
      }),
    });
    if (!r.ok) { console.error('text upstream', r.status, (await r.text()).slice(0, 300)); throw new HttpError(502, 'UPSTREAM', 'AI service unavailable (' + r.status + ')'); }
    const j = await r.json();
    const call = (j.output ?? []).find((o: any) => o.type === 'function_call' && o.name === tool.name);
    try {
      const out = JSON.parse(call?.arguments ?? '');
      if ((tool.input_schema.required ?? []).every((k: string) => k in out)) return out;
    } catch (_) { console.error('text parse retry', j.status, j.incomplete_details?.reason ?? ''); }
  }
  throw new HttpError(502, 'UPSTREAM', 'AI returned an invalid result, please try again');
}
const textModel = (system: string, user: string, tool: any) =>
  TEXT_PROVIDER === 'anthropic' ? claude(system, user, tool) : TEXT_PROVIDER === 'deepseek' ? deepseek(system, user, tool) : gpt(system, user, tool);

/* ------------------------------------------------------------------ */
/* Schematic images: code-level guard rails                            */
/* ------------------------------------------------------------------ */
const RESULT_FIGURE_RE = /(western\s*blot|\bblot\b|\bgel\b|electrophores|micrograph|microscop|confocal image|bar\s*(chart|graph)|line\s*(chart|graph)|scatter\s*plot|box\s*plot|histogram|kymograph|heat\s*map|error\s*bar|p\s*[<=>]\s*0|\bn\s*=\s*\d|data\s*(plot|chart)|印迹|电泳|显微(镜)?图|柱状图|折线图|散点图|热图|误差线|ウェスタン|ブロット|電気泳動|顕微鏡(像|写真)|棒グラフ|折れ線|散布図|ヒートマップ)/i;
const STYLES: Record<string, string> = {
  flat: 'clean flat vector scientific illustration, simple rounded icons, consistent line weight, muted academic colours, plain white background',
  line: 'monochrome black line-art scientific diagram, thin uniform strokes, no shading, plain white background, suitable for black-and-white printing',
  soft3d: 'soft 3D rendered scientific illustration, gentle studio lighting, smooth matte surfaces, pastel colours, plain white background',
  sketch: 'hand-drawn pen-and-ink sketch style scientific diagram on plain white paper, clear and legible',
  pasero: 'flat line-art illustration in deep indigo (#1A0080), violet (#8E73CF) and pale lilac (#F1ECFB) on a warm off-white (#F4F7F3) background, rounded friendly shapes',
};
function schematicPrompt(s: any, style: string, lang: string) {
  return `Conceptual SCHEMATIC for an academic ${lang === 'ja' ? 'Japanese' : lang === 'zh' ? 'Chinese' : 'English'}-language poster or talk.
Title: ${String(s.title).slice(0, 200)}
Draw: ${String(s.description).slice(0, 1200)}
Style: ${STYLES[style] ?? STYLES.flat}.
Strict rules: draw ONLY the entities and relationships described above. Do NOT draw data, charts, plots, axes, numbers, statistics, microscopy, gels, blots, or photographs of experiments. Do NOT add extra pathways, molecules or labels. Use only a few short text labels, spelled exactly as in the description; no other text, no watermark, no title text.`;
}
async function gptImage(prompt: string) {
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + OPENAI_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt, size: '1536x1024', quality: IMAGE_QUALITY, n: 1 }),
  });
  if (!r.ok) { console.error('image upstream', r.status); throw new HttpError(502, 'UPSTREAM', 'Image service unavailable (' + r.status + ')'); }
  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new HttpError(502, 'UPSTREAM', 'Empty image response');
  return { image: 'data:image/png;base64,' + b64, w: 1536, h: 1024 };
}

/* ------------------------------------------------------------------ */
/* Quota (counts only)                                                 */
/* ------------------------------------------------------------------ */
async function quotaFor(uid: string, beta: any) {
  const used: Record<string, number> = {};
  for (const a of Object.keys(LIMITS)) {
    const { count } = await admin.from('reporter_usage').select('id', { count: 'exact', head: true })
      .eq('user_id', uid).eq('action', a).eq('ok', true).gte('created_at', beta.starts_at);
    used[a] = count ?? 0;
  }
  return { active: !!beta.active, ends_at: beta.ends_at, used, limit: { ...LIMITS, image: IMAGES_ENABLED ? LIMITS.image : 0 }, images: IMAGES_ENABLED };
}
async function logUsage(uid: string, action: string, ok: boolean, ms: number, detail: string | null = null) {
  await admin.from('reporter_usage').insert({ user_id: uid, action, ok, ms, detail });
}

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */
Deno.serve(async (req) => {
  const headers = { ...cors(req.headers.get('origin')), 'content-type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  const started = Date.now();
  let uid = '', action = '', quota: any = null;
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'METHOD');
    const raw = await req.text();
    if (raw.length > MAX_BODY) throw new HttpError(413, 'TOO_LARGE', 'Material too large');
    const body = JSON.parse(raw || '{}');
    action = String(body.action || '');

    const auth = req.headers.get('authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '');
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) throw new HttpError(401, 'AUTH_REQUIRED');
    uid = u.user.id;
    // Reporter has its own free-trial window (independent of the desktop/mobile beta), set by secrets.
    const now = Date.now();
    const beta = { starts_at: TRIAL_START, ends_at: TRIAL_END, active: now >= Date.parse(TRIAL_START) && now < Date.parse(TRIAL_END) };
    quota = await quotaFor(uid, beta);

    if (action === 'quota') return reply(200, { quota });
    if (action === 'event') {
      const ev = String(body.event || '').slice(0, 40), val = body.value ? String(body.value).slice(0, 40) : null;
      await logUsage(uid, 'event:' + ev, true, 0, [val, body.kind].filter(Boolean).join('|') || null);
      return reply(200, { ok: true });
    }
    // quota key: plan / revise / image (client action "schematic" uses the image allowance)
    action = action === 'schematic' ? 'image' : action;
    if (!(action in LIMITS)) throw new HttpError(400, 'BAD_ACTION');
    if (!beta.active) throw new HttpError(403, 'BETA_INACTIVE');
    if (action === 'image' && !IMAGES_ENABLED) throw new HttpError(503, 'IMAGES_DISABLED');
    if (quota.used[action] >= LIMITS[action]) throw new HttpError(429, 'QUOTA_EXCEEDED');

    // simple burst limit: 8 AI calls per minute per user
    const { count: burst } = await admin.from('reporter_usage').select('id', { count: 'exact', head: true })
      .eq('user_id', uid).in('action', Object.keys(LIMITS)).gte('created_at', new Date(Date.now() - 60_000).toISOString());
    if ((burst ?? 0) >= 8) throw new HttpError(429, 'RATE_LIMIT', 'Too many requests, please wait a minute');

    let out: any;
    const s = body.settings ?? {};
    const kind = s.kind === 'ppt' ? 'ppt' : 'poster';
    if (action === 'plan') {
      const user = `SETTINGS:\n${JSON.stringify(s)}\n\nUSER REQUIREMENTS (follow unless they break the integrity rules):\n${body.material?.requirements || '(none)'}\n\n` +
        (body.structure ? `EXISTING CONTENT STRUCTURE (reuse it, adjust only if needed):\n${JSON.stringify(body.structure)}\n\n` : '') +
        `MATERIAL (JSON; passages have ids; figures are the authors' originals):\n${JSON.stringify(body.material)}`;
      out = await textModel(SCIENCE_RULES + '\n\n' + taskPrompt(s), user, deliverTool(kind));
    } else if (action === 'revise') {
      const user = `SETTINGS:\n${JSON.stringify(s)}\n\nCURRENT REPORT:\n${JSON.stringify(body.report)}\n\nCURRENT SCHEMATICS:\n${JSON.stringify(body.schematics ?? [])}\n\nCONTENT STRUCTURE:\n${JSON.stringify(body.structure ?? {})}\n\nRECENT CHAT:\n${JSON.stringify((body.history ?? []).slice(-8))}\n\nMATERIAL:\n${JSON.stringify(body.material)}\n\nINSTRUCTION:\n${String(body.instruction ?? '').slice(0, 2000)}`;
      out = await textModel(SCIENCE_RULES + '\n\n' + taskPrompt(s), user, reviseTool(kind));
    } else {
      // image: only conceptual schematics; result figures are refused in code, not just by prompt
      const sch = body.schematic ?? {};
      const text = `${sch.title ?? ''} ${sch.description ?? ''}`;
      if (!IMAGES_ENABLED) throw new HttpError(503, 'IMAGES_DISABLED');
      if (!String(sch.description ?? '').trim()) throw new HttpError(400, 'BAD_REQUEST');
      if (RESULT_FIGURE_RE.test(text)) throw new HttpError(422, 'REFUSED_RESULT_FIGURE');
      out = await gptImage(schematicPrompt(sch, String(body.style ?? 'flat'), String(body.lang ?? 'en')));
    }
    await logUsage(uid, action, true, Date.now() - started, action === 'image' ? String(body.style ?? '') : kind);
    quota.used[action]++;
    return reply(200, { ...out, quota });
  } catch (e) {
    const err = e instanceof HttpError ? e : new HttpError(500, 'SERVER', 'Server error');
    if (!(e instanceof HttpError)) console.error('reporter error', (e as Error)?.message);
    if (uid && action in LIMITS && err.code === 'UPSTREAM') await logUsage(uid, action, false, Date.now() - started).catch(() => {});
    return reply(err.status, { error: err.message, code: err.code, quota });
  }
});
