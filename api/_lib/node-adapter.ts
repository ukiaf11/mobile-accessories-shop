import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Bridges Vercel's Node.js function signature to the Web `Request`/`Response` pipeline.
 *
 * Vercel's Node runtime invokes handlers as `(req: IncomingMessage, res: ServerResponse)`.
 * The request pipeline in `handle.ts` is written against the Web standard instead, because
 * that is what the test suite drives and what the platform-independent contract looks like.
 * This adapter converts between the two.
 *
 * It also passes a real `Request` straight through, so the same endpoint file keeps working
 * if it is ever run on a runtime that supplies the Web signature directly.
 */

export type NodeRequest = IncomingMessage & { body?: unknown };

export function isWebRequest(value: unknown): value is Request {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Request).headers?.get === 'function' &&
    typeof (value as Request).text === 'function'
  );
}

/**
 * Vercel's helpers may have already consumed and parsed the body, which leaves the stream
 * empty. Prefer whatever they parsed and fall back to reading the stream ourselves.
 */
async function readBody(req: NodeRequest): Promise<string> {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (req.body !== undefined && req.body !== null) {
    try {
      return JSON.stringify(req.body);
    } catch {
      return '';
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function toWebRequest(req: NodeRequest): Promise<Request> {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }

  const method = (req.method ?? 'GET').toUpperCase();
  const host = headers.get('host') ?? 'localhost';
  const proto = headers.get('x-forwarded-proto') ?? 'https';
  const url = `${proto}://${host}${req.url ?? '/'}`;

  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? await readBody(req) : undefined;

  /*
   * `content-length` is re-derived from the bytes we actually hold. The header the client
   * sent is attacker-controlled and, once Vercel has re-serialised a parsed body, no longer
   * describes it — the size guard in the pipeline must measure the real payload.
   */
  if (hasBody) {
    headers.set('content-length', String(Buffer.byteLength(body ?? '', 'utf8')));
  }

  return new Request(url, { method, headers, body });
}

export async function sendWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

/**
 * Wraps a Web-standard handler so it can be exported as a Vercel Node function.
 * Returns the `Response` untouched when invoked with a Web `Request` (as the tests do).
 */
export function withNodeAdapter(handler: (request: Request) => Promise<Response>) {
  async function endpoint(request: Request): Promise<Response>;
  async function endpoint(req: NodeRequest, res: ServerResponse): Promise<void>;
  async function endpoint(
    reqOrRequest: Request | NodeRequest,
    res?: ServerResponse,
  ): Promise<Response | void> {
    if (isWebRequest(reqOrRequest)) return handler(reqOrRequest);

    const response = await handler(await toWebRequest(reqOrRequest as NodeRequest));
    await sendWebResponse(res!, response);
  }

  return endpoint;
}
