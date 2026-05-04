// Allowlist HTML sanitiser used on every rich-text submission. The admin
// surface is small and trusted (admins only), but defence in depth still
// matters: editors can paste arbitrary markup, and the resulting HTML is
// rendered raw on the public site via {@html}. Anything not in the allowlist
// is dropped (tags) or stripped (attributes).

const ALLOWED_TAGS: Record<string, ReadonlySet<string>> = {
	p: new Set(),
	br: new Set(),
	hr: new Set(),
	strong: new Set(),
	b: new Set(),
	em: new Set(),
	i: new Set(),
	u: new Set(),
	s: new Set(),
	h2: new Set(),
	h3: new Set(),
	h4: new Set(),
	ul: new Set(),
	ol: new Set(),
	li: new Set(),
	blockquote: new Set(),
	code: new Set(),
	pre: new Set(),
	figure: new Set(),
	figcaption: new Set(),
	a: new Set(['href', 'title', 'target', 'rel']),
	img: new Set(['src', 'alt', 'title'])
};

const VOID_TAGS = new Set(['br', 'hr', 'img']);

// Tags whose entire contents must be discarded (not just stripped). Children
// of these tags are not text but executable code or unrenderable noise.
const DANGEROUS_RAW_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template']);

const SAFE_URL = /^(?:https?:|mailto:|tel:|\/|#)/i;
const SAFE_IMG = /^(?:https?:|data:image\/(?:png|jpe?g|gif|webp|svg\+xml);)/i;

type Token =
	| { kind: 'text'; value: string }
	| { kind: 'open'; tag: string; attrs: Record<string, string>; selfClose: boolean }
	| { kind: 'close'; tag: string };

function tokenize(input: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	const n = input.length;

	while (i < n) {
		// Skip comments and CDATA outright.
		if (input.startsWith('<!--', i)) {
			const end = input.indexOf('-->', i + 4);
			i = end < 0 ? n : end + 3;
			continue;
		}
		if (input.startsWith('<![CDATA[', i)) {
			const end = input.indexOf(']]>', i + 9);
			i = end < 0 ? n : end + 3;
			continue;
		}
		if (input.startsWith('<!', i) || input.startsWith('<?', i)) {
			const end = input.indexOf('>', i);
			i = end < 0 ? n : end + 1;
			continue;
		}

		if (input[i] !== '<') {
			let j = input.indexOf('<', i);
			if (j < 0) j = n;
			tokens.push({ kind: 'text', value: input.slice(i, j) });
			i = j;
			continue;
		}

		// Closing tag.
		if (input[i + 1] === '/') {
			const end = input.indexOf('>', i + 2);
			if (end < 0) {
				i = n;
				break;
			}
			const tag = input.slice(i + 2, end).trim().toLowerCase();
			if (/^[a-z][a-z0-9]*$/.test(tag)) tokens.push({ kind: 'close', tag });
			i = end + 1;
			continue;
		}

		// Opening tag.
		const tagMatch = /^<([a-zA-Z][a-zA-Z0-9]*)/.exec(input.slice(i));
		if (!tagMatch) {
			tokens.push({ kind: 'text', value: '<' });
			i += 1;
			continue;
		}
		const tag = tagMatch[1].toLowerCase();

		// Dangerous raw-text containers: skip the whole element including
		// children. Scripts and stylesheets must never reach the output.
		if (DANGEROUS_RAW_TAGS.has(tag)) {
			const closeRe = new RegExp(`</\\s*${tag}\\s*>`, 'i');
			const rest = input.slice(i);
			const m = closeRe.exec(rest);
			i += m ? m.index + m[0].length : rest.length;
			continue;
		}

		let p = i + tagMatch[0].length;
		const attrs: Record<string, string> = {};
		let selfClose = false;
		while (p < n) {
			while (p < n && /\s/.test(input[p])) p++;
			if (p >= n) break;
			if (input[p] === '/') {
				selfClose = true;
				p++;
				continue;
			}
			if (input[p] === '>') {
				p++;
				break;
			}
			const attrMatch = /^([a-zA-Z_:][\w:.-]*)/.exec(input.slice(p));
			if (!attrMatch) {
				p++;
				continue;
			}
			const aName = attrMatch[1].toLowerCase();
			p += attrMatch[0].length;
			while (p < n && /\s/.test(input[p])) p++;
			let aVal = '';
			if (input[p] === '=') {
				p++;
				while (p < n && /\s/.test(input[p])) p++;
				const q = input[p];
				if (q === '"' || q === "'") {
					const end = input.indexOf(q, p + 1);
					if (end < 0) {
						aVal = input.slice(p + 1);
						p = n;
					} else {
						aVal = input.slice(p + 1, end);
						p = end + 1;
					}
				} else {
					const m = /^[^\s>]*/.exec(input.slice(p));
					aVal = m ? m[0] : '';
					p += aVal.length;
				}
			}
			attrs[aName] = decodeEntities(aVal);
		}
		tokens.push({ kind: 'open', tag, attrs, selfClose });
		i = p;
	}

	return tokens;
}

function decodeEntities(s: string): string {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#x?([0-9a-f]+);/gi, (_, n) => {
			const cp = n.startsWith('x') || n.startsWith('X') ? parseInt(n.slice(1), 16) : parseInt(n, 10);
			return Number.isFinite(cp) ? String.fromCodePoint(cp) : '';
		});
}

function encodeText(s: string): string {
	return s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
}

function encodeAttr(s: string): string {
	return s.replace(/[&"<>]/g, (c) =>
		c === '&' ? '&amp;' : c === '"' ? '&quot;' : c === '<' ? '&lt;' : '&gt;'
	);
}

export function sanitizeHtml(input: string | null | undefined): string {
	if (!input) return '';
	const tokens = tokenize(input);
	const out: string[] = [];
	const open: string[] = [];

	for (const t of tokens) {
		if (t.kind === 'text') {
			out.push(encodeText(t.value));
			continue;
		}

		if (t.kind === 'open') {
			const allowed = ALLOWED_TAGS[t.tag];
			if (!allowed) continue; // drop tag, keep children (already streaming)

			const safeAttrs: string[] = [];
			for (const [name, value] of Object.entries(t.attrs)) {
				if (!allowed.has(name)) continue;
				if (name === 'href' && !SAFE_URL.test(value)) continue;
				if (name === 'src' && !SAFE_IMG.test(value)) continue;
				if (name === 'target') {
					safeAttrs.push(`target="${encodeAttr(value)}"`);
					continue;
				}
				safeAttrs.push(`${name}="${encodeAttr(value)}"`);
			}

			if (t.tag === 'a') {
				const hasTarget = safeAttrs.some((a) => a.startsWith('target='));
				const hasRel = safeAttrs.some((a) => a.startsWith('rel='));
				if (hasTarget && !hasRel) safeAttrs.push('rel="noopener noreferrer"');
			}

			const isVoid = VOID_TAGS.has(t.tag);
			const attrStr = safeAttrs.length ? ' ' + safeAttrs.join(' ') : '';
			if (isVoid || t.selfClose) {
				out.push(`<${t.tag}${attrStr} />`);
			} else {
				out.push(`<${t.tag}${attrStr}>`);
				open.push(t.tag);
			}
			continue;
		}

		// Close tag — only emit if it matches an open allowed tag.
		if (!ALLOWED_TAGS[t.tag]) continue;
		const idx = open.lastIndexOf(t.tag);
		if (idx < 0) continue;
		// Close everything down to the match.
		while (open.length - 1 > idx) out.push(`</${open.pop()}>`);
		out.push(`</${open.pop()}>`);
	}

	while (open.length) out.push(`</${open.pop()}>`);

	// Collapse empty paragraphs that some editors insert.
	return out.join('').replace(/<p>\s*<\/p>/g, '').trim();
}

export function htmlToPlainText(input: string | null | undefined): string {
	if (!input) return '';
	const stripped = input
		.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
		.replace(/<br\s*\/?>(?!\s*$)/gi, '\n')
		.replace(/<\/(p|h[1-6]|li|blockquote|figure)\s*>/gi, '\n')
		.replace(/<[^>]+>/g, '');
	return decodeEntities(stripped).replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
