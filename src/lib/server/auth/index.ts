/**
 * Single import surface for authentication and access control.
 *
 *   import { auth } from '$lib/server/auth';            // better-auth instance
 *   import { requireAdmin } from '$lib/server/auth';    // route guards
 */
export { auth } from './config';
export { requireAdmin, ensureAdminRole, isAllowlistedEmail } from './guard';
