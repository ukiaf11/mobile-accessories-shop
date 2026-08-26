import { customRequestSchema } from '../shared/validation.js';
import { customRequestEmail } from '../emails/templates.js';
import { handleRequest } from './_lib/handle.js';
import { withNodeAdapter } from './_lib/node-adapter.js';

/** POST /api/custom-request — blueprint FR-09 / 05 section 2. */
export default withNodeAdapter((request) =>
  handleRequest({
    request,
    schema: customRequestSchema,
    render: customRequestEmail,
    scope: 'api/custom-request',
  }),
);
