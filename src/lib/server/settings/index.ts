/**
 * Site settings: registry + runtime cache + typed accessors.
 *
 *   import { getSettings, setSetting } from '$lib/server/settings';
 *   import { SETTING_DEFS, type SettingDef } from '$lib/server/settings';
 */
export * from './registry';
export {
	getSettings,
	getPublicSettings,
	setSetting,
	setMany,
	parseAndValidate,
	cssVariables,
	googleFontsHref,
	invalidateSettings
} from './runtime';
