import { customRequestSchema } from '../shared/validation';
import { customRequestEmail } from '../emails/templates';
import { handleRequest } from './_lib/handle';

export const config = { runtime: 'nodejs' };

/** POST /api/custom-request — blueprint FR-09 / 05 section 2. */
export default function handler(request: Request): Promise<Response> {
  return handleRequest({
    request,
    schema: customRequestSchema,
    render: customRequestEmail,
    scope: 'api/custom-request',
  });
}
