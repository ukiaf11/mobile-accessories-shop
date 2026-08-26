import { useCallback, useRef, useState } from 'react';
import type { ApiResult, CustomRequestPayload, OrderRequestPayload } from '../types';
import { submitCustomRequest, submitOrder } from '../lib/api';

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

interface SubmitState {
  status: SubmitStatus;
  requestId: string | null;
  error: string | null;
  code: string | null;
}

const INITIAL: SubmitState = { status: 'idle', requestId: null, error: null, code: null };

/**
 * Wraps a request submission with duplicate protection.
 *
 * A double-click, or a retry after a timeout where the server actually succeeded, must not
 * produce two emails. The in-flight ref blocks the first case; reusing the same `requestId`
 * as an idempotency key lets the server collapse the second (blueprint 05 section 7).
 */
export function useSubmitRequest() {
  const [state, setState] = useState<SubmitState>(INITIAL);
  const inFlight = useRef(false);

  const run = useCallback(async (send: () => Promise<ApiResult>) => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setState({ status: 'submitting', requestId: null, error: null, code: null });

    try {
      const result = await send();
      if (result.success) {
        setState({ status: 'success', requestId: result.requestId, error: null, code: null });
      } else {
        // Form values are deliberately left untouched so the customer can retry
        // without retyping anything (blueprint 03 section 15).
        setState({ status: 'error', requestId: null, error: result.error, code: result.code });
      }
      return result;
    } finally {
      inFlight.current = false;
    }
  }, []);

  const sendOrder = useCallback(
    (payload: OrderRequestPayload) => run(() => submitOrder(payload)),
    [run],
  );

  const sendCustom = useCallback(
    (payload: CustomRequestPayload) => run(() => submitCustomRequest(payload)),
    [run],
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, sendOrder, sendCustom, reset, isSubmitting: state.status === 'submitting' };
}
