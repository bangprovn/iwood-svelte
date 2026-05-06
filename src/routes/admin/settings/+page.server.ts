import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import {
	GROUP_DESCRIPTIONS,
	GROUP_LABELS,
	GROUP_ORDER,
	SETTING_DEFS,
	type SettingDef,
	type SettingGroup
} from '$lib/server/settings';
import { getSettings, parseAndValidate, setMany } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

function pickGroup(raw: string | null | undefined): SettingGroup {
	const fallback: SettingGroup = GROUP_ORDER[0];
	if (!raw) return fallback;
	return (GROUP_ORDER as string[]).includes(raw) ? (raw as SettingGroup) : fallback;
}

// Shape passed to the client. Mirrors SettingDef minus the server-only
// `validate` function. The page renders form fields straight from this.
export type ClientFieldDef = {
	key: string;
	group: SettingGroup;
	type: SettingDef['type'];
	label: string;
	help?: string;
	default: string | number | boolean;
	options?: { value: string; label: string }[];
	min?: number;
	max?: number;
	step?: number;
};

function toClientDef(def: SettingDef): ClientFieldDef {
	const base: ClientFieldDef = {
		key: def.key,
		group: def.group,
		type: def.type,
		label: def.label,
		help: def.help,
		default: def.default
	};
	if (def.type === 'select') base.options = def.options;
	if (def.type === 'number') {
		base.min = def.min;
		base.max = def.max;
		base.step = def.step;
	}
	return base;
}

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const group = pickGroup(event.url.searchParams.get('group'));
	const values = await getSettings();
	const fields = SETTING_DEFS.filter((d) => d.group === group).map(toClientDef);
	return {
		group,
		values,
		groups: GROUP_ORDER.map((g) => ({
			id: g,
			label: GROUP_LABELS[g],
			description: GROUP_DESCRIPTIONS[g]
		})),
		fields
	};
};

export const actions: Actions = {
	save: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const group = pickGroup(fd.get('__group')?.toString());

		const updates: Record<string, string | number | boolean> = {};
		const errors: Record<string, string> = {};
		const submitted: Record<string, string> = {};

		const groupDefs = SETTING_DEFS.filter((d) => d.group === group);
		for (const def of groupDefs) {
			const raw = fd.get(`s::${def.key}`);
			// For toggles, an unchecked checkbox sends nothing — pass null and
			// parseAndValidate treats it as false.
			const present = fd.has(`s::${def.key}`) || def.type === 'toggle';
			if (!present) continue;
			submitted[def.key] = (raw ?? '').toString();
			const result = parseAndValidate(def, raw);
			if (!result.ok) {
				errors[def.key] = result.error;
			} else {
				updates[def.key] = result.value;
			}
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, { group, errors, submitted, message: 'Some settings could not be saved.' });
		}

		try {
			await setMany(updates);
		} catch (e) {
			return fail(500, {
				group,
				errors: {},
				submitted,
				message: e instanceof Error ? e.message : String(e)
			});
		}

		return { group, success: true, savedCount: Object.keys(updates).length };
	},

	reset: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const group = pickGroup(fd.get('__group')?.toString());
		const groupDefs = SETTING_DEFS.filter((d) => d.group === group);
		const defaults: Record<string, string | number | boolean> = {};
		for (const def of groupDefs) defaults[def.key] = def.default;
		try {
			await setMany(defaults);
		} catch (e) {
			return fail(500, {
				group,
				errors: {},
				submitted: {},
				message: e instanceof Error ? e.message : String(e)
			});
		}
		return { group, success: true, savedCount: groupDefs.length, reset: true };
	}
};
