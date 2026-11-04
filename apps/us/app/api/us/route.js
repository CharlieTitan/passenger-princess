import { kv } from '@vercel/kv';
import { seedItems } from '../../../lib/usData';
import { createHandlers } from '../../../lib/usServer.mjs';
export const dynamic = 'force-dynamic';
const handlers = createHandlers(kv, seedItems);
export const GET = handlers.GET;
export const POST = handlers.POST;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
