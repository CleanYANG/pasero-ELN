// Mobile-only image generation. Reporter/desktop presets keep their existing path.
export class MobileImageError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

// The larger request allowance is used only by authenticated mobile image edits.
export async function readMobileImageBody(req: Request): Promise<string> {
  const maxBytes = 20_100_000;
  const tooLarge = () => new MobileImageError(413, 'TOO_LARGE', 'Reference image too large');
  if (Number(req.headers.get('content-length')) > maxBytes) throw tooLarge();
  const reader = req.body?.getReader();
  if (!reader) return '{}';
  const decoder = new TextDecoder();
  let size = 0, raw = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw tooLarge(); }
      raw += decoder.decode(value, { stream: true });
    }
    return raw + decoder.decode();
  } finally { reader.releaseLock(); }
}

function referenceForEdit(value: unknown): { image: string; prompts: string[] } | undefined {
  if (value === undefined) return undefined;
  const invalid = () => new MobileImageError(400, 'BAD_IMAGE_REFERENCE', 'Invalid reference image');
  if (!value || typeof value !== 'object') throw invalid();
  const ref = value as { image?: unknown; prompts?: unknown };
  if (typeof ref.image !== 'string' || !ref.image.startsWith('data:image/png;base64,') || ref.image.length > 20_000_000
    || !Array.isArray(ref.prompts) || ref.prompts.length > 10
    || ref.prompts.some(p => typeof p !== 'string' || !p.trim() || p.length > 1200)) throw invalid();
  try { pngDimensions(ref.image.slice(22)); } catch { throw invalid(); }
  return { image: ref.image, prompts: ref.prompts };
}

export function mobileImagePrompt(description: string, language: string): string {
  if (typeof description !== 'string' || !description.trim() || description.length > 1200) {
    throw new MobileImageError(400, 'BAD_IMAGE_PROMPT', 'Enter an image description of up to 1200 characters');
  }
  const labelLanguage = language === 'zh' ? 'Simplified Chinese' : language === 'ja' ? 'Japanese' : 'English';
  return `Create the scientific illustration requested in the USER BRIEF below.
Visual direction: follow the user's requested style, medium, colours, background, lighting, composition, aspect ratio and level of detail. Their visual instructions take priority over defaults. If a visual choice is unspecified, choose a clear, readable scientific illustration appropriate to the subject.
Text: follow the requested label language and reproduce supplied scientific names, symbols and labels accurately. When the user has not chosen a label language, use ${labelLanguage}. Include titles, numbered steps, units and numerical annotations when requested or supplied; omit text when the user asks for an unlabelled image.
Scientific accuracy: represent established biology and the described relationships accurately. Keep molecular and organelle locations consistent with the stated context. Do not invent experimental measurements, statistics, findings or evidence, or present an illustration as an observed experimental result. Stay within the requested subject and avoid unsupported extra mechanisms.
USER BRIEF (JSON string):
${JSON.stringify(description)}`;
}

function pngDimensions(base64: unknown): { w: number; h: number } {
  const invalid = () => new MobileImageError(502, 'UPSTREAM', 'Invalid image response');
  if (typeof base64 !== 'string' || base64.length < 44 || base64.length > 24_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw invalid();
  let header: Uint8Array;
  try { header = Uint8Array.from(atob(base64.slice(0, 44)), (char) => char.charCodeAt(0)); }
  catch { throw invalid(); }
  const signature = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82];
  if (header.length < 24 || signature.some((value, index) => header[index] !== value)) throw invalid();
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  const w = view.getUint32(16), h = view.getUint32(20);
  if (!w || !h || w > 4096 || h > 4096) throw invalid();
  return { w, h };
}

export async function generateMobileImage(options: {
  description: string; language: string; model: string; quality: string; key: string; signal?: AbortSignal; reference?: unknown;
}, fetcher: typeof fetch = fetch) {
  let prompt = mobileImagePrompt(options.description, options.language);
  const reference = referenceForEdit(options.reference);
  if (reference) {
    prompt = `Edit the supplied reference image according to the CURRENT REQUEST below.
Continuity: this is a follow-up to an existing image. A request only about colour, style, labels or layout must keep the same biological subject, cell type, pathway, molecules, relationships and arrow directions. Preserve all unrequested content; never substitute a different pathway. Previous instructions are context, and the current request overrides only the properties it explicitly changes. If the current request explicitly asks for a different subject, follow that request.
PREVIOUS IMAGE INSTRUCTIONS (chronological JSON array):
${JSON.stringify(reference.prompts)}
CURRENT REQUEST AND SCIENTIFIC RULES:
${prompt}`;
  }
  const response = await fetcher('https://api.openai.com/v1/images/' + (reference ? 'edits' : 'generations'), {
    method: 'POST', signal: options.signal,
    headers: { Authorization: 'Bearer ' + options.key, 'content-type': 'application/json' },
    body: JSON.stringify({ model: options.model, prompt, size: 'auto', quality: options.quality, output_format: 'png', n: 1,
      ...(reference ? { images: [{ image_url: reference.image }] } : {}) }),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new MobileImageError(502, 'UPSTREAM', 'Image service unavailable (' + response.status + ')');
  }
  const payload = await response.json();
  const base64 = payload.data?.[0]?.b64_json;
  const dimensions = pngDimensions(base64);
  return { image: 'data:image/png;base64,' + base64, ...dimensions };
}
