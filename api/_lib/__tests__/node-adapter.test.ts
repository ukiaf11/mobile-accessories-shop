import { describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import type { ServerResponse } from 'node:http';
import { toWebRequest, withNodeAdapter, type NodeRequest } from '../node-adapter';
import orderHandler from '../../order';

/**
 * Vercel's Node runtime calls handlers as `(req: IncomingMessage, res: ServerResponse)`.
 * Production returned FUNCTION_INVOCATION_FAILED with
 * "request.headers.get is not a function" because the pipeline expected a Web `Request`.
 * These tests drive the endpoints exactly the way the platform does.
 */

function nodeRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  parsedBody?: unknown;
}): NodeRequest {
  const { method = 'POST', url = '/api/order', headers = {}, body = '', parsedBody } = options;
  const stream = Readable.from(body ? [Buffer.from(body)] : []) as unknown as NodeRequest;
  stream.method = method;
  stream.url = url;
  stream.headers = { host: 'shop.example', 'content-type': 'application/json', ...headers };
  if (parsedBody !== undefined) stream.body = parsedBody;
  return stream;
}

function fakeResponse() {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 0,
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    },
    end: vi.fn(),
  };
  return {
    res: res as unknown as ServerResponse,
    headers,
    get body() {
      const [chunk] = res.end.mock.calls[0] ?? [];
      return chunk ? Buffer.from(chunk as Buffer).toString('utf8') : '';
    },
    get status() {
      return res.statusCode;
    },
  };
}

describe('toWebRequest', () => {
  it('builds an absolute URL from the host header', async () => {
    const request = await toWebRequest(nodeRequest({ url: '/api/order' }));
    expect(request.url).toBe('https://shop.example/api/order');
  });

  it('carries headers across, including the forwarded client IP', async () => {
    const request = await toWebRequest(
      nodeRequest({ headers: { 'x-forwarded-for': '203.0.113.7' } }),
    );
    expect(request.headers.get('x-forwarded-for')).toBe('203.0.113.7');
  });

  it('reads a streamed body', async () => {
    const request = await toWebRequest(nodeRequest({ body: '{"a":1}' }));
    await expect(request.text()).resolves.toBe('{"a":1}');
  });

  it('uses the pre-parsed body when the platform already consumed the stream', async () => {
    const request = await toWebRequest(nodeRequest({ body: '', parsedBody: { a: 1 } }));
    await expect(request.text()).resolves.toBe('{"a":1}');
  });

  it('re-derives content-length from the real bytes, not the claimed header', async () => {
    // The size guard must measure what we actually hold; the client's header is
    // attacker-controlled and stale once the platform re-serialises a parsed body.
    const request = await toWebRequest(
      nodeRequest({ body: '{"a":1}', headers: { 'content-length': '999999' } }),
    );
    expect(request.headers.get('content-length')).toBe('7');
  });

  it('does not attach a body to a GET', async () => {
    const request = await toWebRequest(nodeRequest({ method: 'GET', body: '' }));
    expect(request.method).toBe('GET');
    expect(request.body).toBeNull();
  });
});

describe('withNodeAdapter', () => {
  it('passes a real Web Request straight through', async () => {
    const wrapped = withNodeAdapter(async () => new Response('ok', { status: 201 }));
    const response = await wrapped(new Request('https://shop.example/api/order'));
    expect(response.status).toBe(201);
  });

  it('writes status, headers and body onto a Node response', async () => {
    const wrapped = withNodeAdapter(async () =>
      new Response(JSON.stringify({ hello: 'world' }), {
        status: 418,
        headers: { 'Content-Type': 'application/json', 'X-Test': 'yes' },
      }),
    );
    const out = fakeResponse();
    await wrapped(nodeRequest({}), out.res);

    expect(out.status).toBe(418);
    expect(out.headers['x-test']).toBe('yes');
    expect(JSON.parse(out.body)).toEqual({ hello: 'world' });
  });
});

describe('the real endpoint under the Node signature', () => {
  it('returns 405 for a GET instead of crashing', async () => {
    const out = fakeResponse();
    await orderHandler(nodeRequest({ method: 'GET' }), out.res);
    expect(out.status).toBe(405);
  });

  it('validates a malformed body and returns field errors', async () => {
    const out = fakeResponse();
    const body = JSON.stringify({ requestType: 'order' });
    await orderHandler(
      nodeRequest({ body, headers: { 'x-forwarded-for': '192.0.2.10' } }),
      out.res,
    );
    expect(out.status).toBe(422);
    expect(JSON.parse(out.body).code).toBe('validation_error');
  });

  it('runs a well-formed request all the way to the mail step', async () => {
    const out = fakeResponse();
    const body = JSON.stringify({
      requestType: 'order',
      customer: { name: 'Rahul Kumar', phone: '9876543210' },
      device: { type: 'smartphone', brand: 'Apple', model: 'iPhone 15 Pro' },
      items: [{ productId: 'p', name: 'Clear Case', quantity: 1, unitPrice: 299 }],
      fulfillment: 'pickup',
      requestId: 'MAS-20260826-7K3P',
    });
    await orderHandler(
      nodeRequest({ body, headers: { 'x-forwarded-for': '192.0.2.11' } }),
      out.res,
    );
    // 503 (not 500) proves the pipeline ran and only the unset mail config stopped it.
    expect(out.status).toBe(503);
    expect(JSON.parse(out.body).code).toBe('not_configured');
  });
});
