import worker from '../../cloudflare/worker.js';

export const onRequest = (context) => worker.fetch(context.request, context.env, context);
