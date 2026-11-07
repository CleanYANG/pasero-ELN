/** Pass through provider SSE without buffering the answer or recording its content. */
export function chatStreamResponse(
  upstream: Response, headers: Record<string, string>, abort: AbortController,
  finished: (ok: boolean, firstTokenMs: number | null) => Promise<void>, started: number
): Response {
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  let cancelled = false, complete = false, failed = false, firstTokenMs: number | null = null;
  let buffer = "", data: string[] = [];
  function inspect(chunk: string) {
    buffer += chunk;
    let end: number;
    while ((end = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, end).replace(/\r$/, '');
      buffer = buffer.slice(end + 1);
      if (!line) {
        if (data.length) {
          const payload = data.join('\n'); data = [];
          if (payload === '[DONE]') continue;
          const event = JSON.parse(payload);
          if (event.type === 'response.completed') complete = event.response?.status === 'completed';
          if (['error', 'response.failed', 'response.incomplete'].includes(event.type)) failed = true;
          if (firstTokenMs === null && ['response.output_text.delta', 'response.refusal.delta'].includes(event.type) && event.delta) firstTokenMs = Date.now() - started;
        }
      } else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
  }
  return new Response(new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;
          inspect(decoder.decode(value, { stream: true }));
          if (!cancelled) controller.enqueue(value);
        }
        inspect(decoder.decode());
      } catch {
        failed = true;
      } finally {
        await finished(complete && !failed && !cancelled, firstTokenMs).catch(() => {});
        if (!cancelled) {
          if (!complete || failed) controller.enqueue(new TextEncoder().encode('data: {"type":"error","code":"AI_STREAM_INTERRUPTED"}\n\n'));
          controller.close();
        }
        abort.abort();
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    },
    cancel() { cancelled = true; abort.abort(); return reader.cancel().catch(() => {}); }
  }), { headers: { ...headers, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', 'x-accel-buffering': 'no' } });
}
