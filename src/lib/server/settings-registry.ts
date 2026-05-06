// Site settings registry. Defines every tweakable setting in the admin
// "Settings" UI: which group/tab it lives in, its field type, default,
// validator, and whether it's exposed to the public client.
//
// Adding a new setting = adding one entry here. The /admin/settings page,
// the typed accessor, and the public CSS-vars layer all read from this
// registry, so there's no need to touch DB migrations or layouts.

export type SettingValue = string | number | boolean;

export type SettingGroup =
	| 'appearance'
	| 'theme'
	| 'system'
	| 'seo'
	| 'integrations'
	| 'social';

export type FieldType =
	| 'text'
	| 'textarea'
	| 'color'
	| 'image'
	| 'select'
	| 'toggle'
	| 'number'
	| 'url'
	| 'email';

type BaseDef<T extends SettingValue> = {
	key: string;
	group: SettingGroup;
	label: string;
	help?: string;
	default: T;
	isPublic: boolean;
	validate?: (raw: string) => string | null; // returns error message or null
};

export type TextDef = BaseDef<string> & { type: 'text' | 'textarea' | 'url' | 'email' };
export type ColorDef = BaseDef<string> & { type: 'color' };
export type ImageDef = BaseDef<string> & { type: 'image' };
export type NumberDef = BaseDef<number> & {
	type: 'number';
	min?: number;
	max?: number;
	step?: number;
};
export type ToggleDef = BaseDef<boolean> & { type: 'toggle' };
export type SelectDef = BaseDef<string> & {
	type: 'select';
	options: { value: string; label: string }[];
};

export type SettingDef =
	| TextDef
	| ColorDef
	| ImageDef
	| NumberDef
	| ToggleDef
	| SelectDef;

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const URL_OR_PATH_RE = /^(https?:\/\/[^\s]+|\/[^\s]*)$/;

const validateHex = (raw: string) => (HEX_RE.test(raw.trim()) ? null : 'Must be a hex color (e.g. #e30613)');
const validateUrlOrPath = (raw: string) => {
	if (!raw) return null;
	return URL_OR_PATH_RE.test(raw.trim()) ? null : 'Must be a URL or absolute path';
};
const validateEmail = (raw: string) => {
	if (!raw) return null;
	return /.+@.+\..+/.test(raw.trim()) ? null : 'Must be a valid email address';
};

export const SETTING_DEFS: SettingDef[] = [
	// ---------------- APPEARANCE (logo / colors / brand-level visuals) ----
	{
		key: 'appearance.site_logo',
		group: 'appearance',
		type: 'image',
		label: 'Site logo',
		help: 'Shown in the public header. Leave empty to use the default text mark.',
		default: '',
		isPublic: true,
		validate: validateUrlOrPath
	},
	{
		key: 'appearance.site_logo_dark',
		group: 'appearance',
		type: 'image',
		label: 'Site logo (dark backgrounds)',
		help: 'Optional alternate logo for dark sections.',
		default: '',
		isPublic: true,
		validate: validateUrlOrPath
	},
	{
		key: 'appearance.favicon',
		group: 'appearance',
		type: 'image',
		label: 'Favicon',
		help: 'Browser tab icon. PNG or SVG, 32x32 or larger.',
		default: '',
		isPublic: true,
		validate: validateUrlOrPath
	},
	{
		key: 'appearance.primary_color',
		group: 'appearance',
		type: 'color',
		label: 'Primary / accent color',
		help: 'Used for buttons, links, and brand accents. Maps to --accent.',
		default: '#e30613',
		isPublic: true,
		validate: validateHex
	},
	{
		key: 'appearance.primary_color_hover',
		group: 'appearance',
		type: 'color',
		label: 'Primary hover color',
		help: 'Hover state for the primary color. Maps to --accent-hover.',
		default: '#b30510',
		isPublic: true,
		validate: validateHex
	},
	{
		key: 'appearance.ink_color',
		group: 'appearance',
		type: 'color',
		label: 'Foreground / ink color',
		help: 'Main text and dark surface color. Maps to --ink.',
		default: '#0f0f10',
		isPublic: true,
		validate: validateHex
	},
	{
		key: 'appearance.paper_color',
		group: 'appearance',
		type: 'color',
		label: 'Background / paper color',
		help: 'Main page background. Maps to --paper.',
		default: '#ffffff',
		isPublic: true,
		validate: validateHex
	},
	{
		key: 'appearance.bone_color',
		group: 'appearance',
		type: 'color',
		label: 'Secondary background',
		help: 'Used for card and panel backgrounds. Maps to --bone.',
		default: '#f6f4f0',
		isPublic: true,
		validate: validateHex
	},

	// ---------------- THEME (typography + radius — granular controls) ----
	{
		key: 'theme.font_body',
		group: 'theme',
		type: 'select',
		label: 'Body font',
		help: 'Font family used for paragraphs and UI text.',
		default: 'Be Vietnam Pro',
		isPublic: true,
		options: [
			{ value: 'Be Vietnam Pro', label: 'Be Vietnam Pro (default)' },
			{ value: 'Inter', label: 'Inter' },
			{ value: 'Roboto', label: 'Roboto' },
			{ value: 'Source Sans 3', label: 'Source Sans 3' },
			{ value: 'IBM Plex Sans', label: 'IBM Plex Sans' },
			{ value: 'system-ui', label: 'System UI (no web font)' }
		]
	},
	{
		key: 'theme.font_heading',
		group: 'theme',
		type: 'select',
		label: 'Heading / display font',
		help: 'Font family used for headlines and the brand mark.',
		default: 'Barlow Condensed',
		isPublic: true,
		options: [
			{ value: 'Barlow Condensed', label: 'Barlow Condensed (default)' },
			{ value: 'Barlow', label: 'Barlow' },
			{ value: 'Oswald', label: 'Oswald' },
			{ value: 'Bebas Neue', label: 'Bebas Neue' },
			{ value: 'Be Vietnam Pro', label: 'Be Vietnam Pro' },
			{ value: 'Roboto Condensed', label: 'Roboto Condensed' }
		]
	},
	{
		key: 'theme.radius',
		group: 'theme',
		type: 'select',
		label: 'Corner radius',
		help: 'Controls the softness of buttons, cards, and inputs.',
		default: 'sharp',
		isPublic: true,
		options: [
			{ value: 'sharp', label: 'Sharp (4px / 8px — default)' },
			{ value: 'round', label: 'Rounded (8px / 14px)' },
			{ value: 'soft', label: 'Soft (14px / 22px)' }
		]
	},
	{
		key: 'theme.density',
		group: 'theme',
		type: 'select',
		label: 'Density',
		help: 'Controls overall padding / vertical rhythm.',
		default: 'comfortable',
		isPublic: true,
		options: [
			{ value: 'compact', label: 'Compact' },
			{ value: 'comfortable', label: 'Comfortable (default)' },
			{ value: 'spacious', label: 'Spacious' }
		]
	},
	{
		key: 'theme.mode_default',
		group: 'theme',
		type: 'select',
		label: 'Default color mode',
		help: 'Light mode is the only mode currently rendered, but this is reserved for upcoming dark-mode work.',
		default: 'light',
		isPublic: true,
		options: [
			{ value: 'light', label: 'Light' },
			{ value: 'dark', label: 'Dark (preview)' },
			{ value: 'auto', label: 'Auto (follow OS)' }
		]
	},

	// ---------------- SYSTEM (identity, contact, ops switches) ----
	{
		key: 'system.site_name',
		group: 'system',
		type: 'text',
		label: 'Site name',
		help: 'Shown in the browser title bar and as the footer brand.',
		default: 'iWood',
		isPublic: true
	},
	{
		key: 'system.site_tagline',
		group: 'system',
		type: 'text',
		label: 'Tagline',
		help: 'Optional short descriptor shown next to the brand mark.',
		default: 'Giải pháp trần tường vách',
		isPublic: true
	},
	{
		key: 'system.contact_email',
		group: 'system',
		type: 'email',
		label: 'Contact email',
		help: 'Lead notifications and reply-to address for forms.',
		default: '',
		isPublic: false,
		validate: validateEmail
	},
	{
		key: 'system.contact_phone',
		group: 'system',
		type: 'text',
		label: 'Contact phone',
		help: 'Public-facing phone number, displayed in headers and footers.',
		default: '',
		isPublic: true
	},
	{
		key: 'system.contact_address',
		group: 'system',
		type: 'textarea',
		label: 'Contact address',
		help: 'Headquarters address. Plain text, line breaks preserved.',
		default: '',
		isPublic: true
	},
	{
		key: 'system.business_hours',
		group: 'system',
		type: 'text',
		label: 'Business hours',
		help: 'Free-form, e.g. "8:00 — 17:30 (Mon — Sat)".',
		default: '',
		isPublic: true
	},
	{
		key: 'system.maintenance_mode',
		group: 'system',
		type: 'toggle',
		label: 'Maintenance mode',
		help: 'When on, public visitors see a holding page. Admin routes stay accessible.',
		default: false,
		isPublic: false
	},
	{
		key: 'system.maintenance_message',
		group: 'system',
		type: 'textarea',
		label: 'Maintenance message',
		help: 'Message shown to public visitors during maintenance.',
		default: 'We are performing scheduled maintenance. Please check back soon.',
		isPublic: false
	},

	// ---------------- SEO ----
	{
		key: 'seo.default_meta_title',
		group: 'seo',
		type: 'text',
		label: 'Default meta title',
		help: 'Fallback <title> for pages that do not set one.',
		default: '',
		isPublic: true
	},
	{
		key: 'seo.default_meta_description',
		group: 'seo',
		type: 'textarea',
		label: 'Default meta description',
		help: 'Fallback meta description used by SEO and social previews.',
		default: '',
		isPublic: true
	},
	{
		key: 'seo.default_og_image',
		group: 'seo',
		type: 'image',
		label: 'Default Open Graph image',
		help: 'Used for link previews when a page does not specify its own.',
		default: '',
		isPublic: true,
		validate: validateUrlOrPath
	},
	{
		key: 'seo.robots_default',
		group: 'seo',
		type: 'select',
		label: 'Default robots directive',
		help: 'Applied to pages that do not override their own robots tag.',
		default: 'index,follow',
		isPublic: true,
		options: [
			{ value: 'index,follow', label: 'index, follow' },
			{ value: 'noindex,follow', label: 'noindex, follow' },
			{ value: 'noindex,nofollow', label: 'noindex, nofollow' }
		]
	},

	// ---------------- INTEGRATIONS ----
	{
		key: 'integrations.gtm_id',
		group: 'integrations',
		type: 'text',
		label: 'Google Tag Manager ID',
		help: 'GTM container ID, e.g. "GTM-XXXXXX". Leave empty to disable.',
		default: '',
		isPublic: true
	},
	{
		key: 'integrations.ga4_id',
		group: 'integrations',
		type: 'text',
		label: 'Google Analytics 4 ID',
		help: 'Measurement ID, e.g. "G-XXXXXXX". Used only when GTM is empty.',
		default: '',
		isPublic: true
	},
	{
		key: 'integrations.meta_pixel_id',
		group: 'integrations',
		type: 'text',
		label: 'Meta Pixel ID',
		help: 'Facebook / Meta pixel ID for ad tracking.',
		default: '',
		isPublic: true
	},
	{
		key: 'integrations.zalo_id',
		group: 'integrations',
		type: 'text',
		label: 'Zalo OA ID',
		help: 'Zalo Official Account ID for the chat widget.',
		default: '',
		isPublic: true
	},

	// ---------------- SOCIAL ----
	{
		key: 'social.facebook_url',
		group: 'social',
		type: 'url',
		label: 'Facebook URL',
		default: '',
		isPublic: true,
		validate: validateUrlOrPath
	},
	{
		key: 'social.instagram_url',
		group: 'social',
		type: 'url',
		label: 'Instagram URL',
		default: '',
		isPublic: true,
		validate: validateUrlOrPath
	},
	{
		key: 'social.youtube_url',
		group: 'social',
		type: 'url',
		label: 'YouTube URL',
		default: '',
		isPublic: true,
		validate: validateUrlOrPath
	},
	{
		key: 'social.tiktok_url',
		group: 'social',
		type: 'url',
		label: 'TikTok URL',
		default: '',
		isPublic: true,
		validate: validateUrlOrPath
	}
];

export const SETTING_DEF_BY_KEY: Record<string, SettingDef> = Object.fromEntries(
	SETTING_DEFS.map((d) => [d.key, d])
);

export const GROUP_ORDER: SettingGroup[] = [
	'appearance',
	'theme',
	'system',
	'seo',
	'integrations',
	'social'
];

export const GROUP_LABELS: Record<SettingGroup, string> = {
	appearance: 'Appearance',
	theme: 'Theme',
	system: 'System',
	seo: 'SEO',
	integrations: 'Integrations',
	social: 'Social'
};

export const GROUP_DESCRIPTIONS: Record<SettingGroup, string> = {
	appearance: 'Logos, colors, and brand-level visuals applied across the public site.',
	theme: 'Typography, corner radius, and density controls.',
	system: 'Site identity, contact info, and operational switches like maintenance mode.',
	seo: 'Default meta tags and robots directives used as fallbacks across every page.',
	integrations: 'Third-party scripts: analytics, ads, and chat widgets.',
	social: 'Public links to your social profiles, used in the footer and contact pages.'
};

export function defsByGroup(group: SettingGroup): SettingDef[] {
	return SETTING_DEFS.filter((d) => d.group === group);
}
