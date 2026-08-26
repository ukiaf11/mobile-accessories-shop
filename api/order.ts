import { orderRequestSchema } from '../shared/validation.js';
import { orderEmail } from '../emails/templates.js';
import { handleRequest } from './_lib/handle.js';
import { withNodeAdapter } from './_lib/node-adapter.js';

/**
 * POST /api/order — blueprint 02 section 6 request contract.
 *
 * The pipeline is Web-standard; `withNodeAdapter` presents it in the signature Vercel's
 * Node runtime actually calls.
 */
export default withNodeAdapter((request) =>
  handleRequest({
    request,
    schema: orderRequestSchema,
    render: orderEmail,
    scope: 'api/order',
  }),
);
