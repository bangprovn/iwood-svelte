import { error, json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { seed } from '$lib/server/db/seed';
import type { RequestHandler } from './$types';

/**
 * Dev-only: wipes catalog/editorial tables and re-seeds them from the
 * static fixtures. Hit it with:
 *   curl -X POST http://localhost:5173/api/admin/seed
 */
export const POST: RequestHandler = async () => {
	if (!dev) throw error(403, 'Seeding disabled outside dev');
	try {
		const summary = await seed();
		return json({ ok: true, summary });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		console.error('[seed] failed:', e);
		return json({ ok: false, error: msg }, { status: 500 });
	}
};
