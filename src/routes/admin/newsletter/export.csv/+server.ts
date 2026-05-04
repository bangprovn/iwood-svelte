import { requireAdmin } from '$lib/server/admin-guard';
import { listNewsletterAdmin } from '$lib/server/admin-repos';
import type { RequestHandler } from './$types';

function csvCell(v: string): string {
	if (v.includes(',') || v.includes('"') || v.includes('\n')) {
		return '"' + v.replaceAll('"', '""') + '"';
	}
	return v;
}

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const rows = await listNewsletterAdmin();
	const lines = ['email,subscribed_at'];
	for (const r of rows) {
		lines.push(`${csvCell(r.email)},${csvCell(new Date(r.createdAt).toISOString())}`);
	}
	const body = lines.join('\n') + '\n';
	return new Response(body, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`
		}
	});
};
