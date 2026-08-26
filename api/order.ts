import { orderRequestSchema } from '../shared/validation';
import { orderEmail } from '../emails/templates';
import { handleRequest } from './_lib/handle';

export const config = { runtime: 'nodejs' };

/** POST /api/order — blueprint 02 section 6 request contract. */
export default function handler(request: Request): Promise<Response> {
  return handleRequest({
    request,
    schema: orderRequestSchema,
    render: orderEmail,
    scope: 'api/order',
  });
}
