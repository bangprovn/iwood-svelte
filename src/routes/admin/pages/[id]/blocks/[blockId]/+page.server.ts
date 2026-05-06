import { redirect } from '@sveltejs/kit';

export function load(event) {
	throw redirect(307, `/admin/pages/${event.params.id}?block=${event.params.blockId}`);
}
