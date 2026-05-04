import type { Reroute } from '@sveltejs/kit';
import { stripLocaleFromPath } from '$lib/i18n/url';

export const reroute: Reroute = ({ url }) => stripLocaleFromPath(url.pathname);
