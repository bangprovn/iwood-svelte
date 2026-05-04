import { error, json } from '@sveltejs/kit';
import { getProject, listMoreProjects } from '$lib/server/repos';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const p = await getProject(params.id);
	if (!p) throw error(404, 'Project not found');
	const more = await listMoreProjects(p.id, p.cat);
	return json({ ...p, more });
};
