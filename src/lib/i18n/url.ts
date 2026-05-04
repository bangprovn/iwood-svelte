// Shared between SvelteKit's sync `reroute` (src/hooks.ts) and the server-side
// locale picker (src/hooks.server.ts). The set of known locale codes is hydrated
// from the DB by the translations cache loader on the first server request.

const knownLocales = new Set<string>();

export function setKnownLocales(codes: Iterable<string>): void {
	knownLocales.clear();
	for (const c of codes) knownLocales.add(c);
}

export function getKnownLocales(): ReadonlySet<string> {
	return knownLocales;
}

function firstSegment(pathname: string): { seg: string; rest: string } {
	const path = pathname.startsWith('/') ? pathname.slice(1) : pathname;
	const slash = path.indexOf('/');
	if (slash === -1) return { seg: path, rest: '' };
	return { seg: path.slice(0, slash), rest: path.slice(slash) };
}

export function pickLocaleFromPath(pathname: string, codes: Iterable<string>): string | null {
	const { seg } = firstSegment(pathname);
	if (!seg) return null;
	for (const c of codes) if (c === seg) return c;
	return null;
}

export function stripLocaleFromPath(pathname: string): string {
	const { seg, rest } = firstSegment(pathname);
	if (seg && knownLocales.has(seg)) return rest === '' ? '/' : rest;
	return pathname;
}

export function localizedHref(path: string, locale: string, defaultLocale: string): string {
	const stripped = stripLocaleFromPath(path);
	if (locale === defaultLocale) return stripped;
	return stripped === '/' ? `/${locale}` : `/${locale}${stripped}`;
}
