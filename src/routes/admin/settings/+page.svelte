<script lang="ts">
	import { enhance } from '$app/forms';
	import { useI18n, t } from '$lib/i18n';
	import Icon from '$lib/components/Icon.svelte';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const i18n = useI18n();

	const errors = $derived((form?.errors ?? {}) as Record<string, string>);
	const submitted = $derived((form?.submitted ?? {}) as Record<string, string>);

	function valueFor(key: string, fallback: unknown): string {
		if (submitted[key] !== undefined) return submitted[key];
		const v = data.values[key] ?? fallback;
		return v === undefined || v === null ? '' : String(v);
	}

	function boolValueFor(key: string, fallback: boolean): boolean {
		if (submitted[key] !== undefined) {
			const s = submitted[key];
			return s === '1' || s === 'on' || s === 'true';
		}
		const v = data.values[key];
		if (v === undefined) return fallback;
		return v === true || v === 1 || v === '1' || v === 'true';
	}

	function settingPrefix(key: string): string {
		return key.startsWith('seo.') || key.startsWith('appearance.')
			? key.replace(/[^a-z0-9]+/gi, '-')
			: 'settings';
	}
</script>

<header class="adm-header">
	<div>
		<h1>{t($i18n, 'admin.settings.title')}</h1>
		<p>{t($i18n, 'admin.settings.sub')}</p>
	</div>
</header>

<div class="settings-shell">
	<aside class="settings-tabs" aria-label="Settings groups">
		{#each data.groups as g (g.id)}
			<a
				href={`?group=${g.id}`}
				class="settings-tab"
				class:active={g.id === data.group}
				data-sveltekit-replacestate
			>
				<span class="t-label">{g.label}</span>
				<span class="t-desc">{g.description}</span>
			</a>
		{/each}
	</aside>

	<section class="settings-panel">
		{#if form?.success}
			<p class="adm-flash">
				{form.reset
					? t($i18n, 'admin.settings.reset_ok')
					: t($i18n, 'admin.settings.saved_ok', { count: form.savedCount ?? 0 })}
			</p>
		{/if}
		{#if form?.message && !form?.success}
			<p class="adm-error">{form.message}</p>
		{/if}

		<form
			method="post"
			action="?/save"
			class="adm-form settings-form"
			use:enhance={() =>
				async ({ update }) => {
					await update({ reset: false });
				}}
		>
			<input type="hidden" name="__group" value={data.group} />

			{#if data.fields.length === 0}
				<p class="adm-help">{t($i18n, 'admin.settings.no_fields')}</p>
			{/if}

			{#each data.fields as field (field.key)}
				<div class="adm-field" class:has-error={errors[field.key]}>
					{#if field.type === 'toggle'}
						<label class="toggle-row">
							<input
								type="checkbox"
								name={`s::${field.key}`}
								value="1"
								checked={boolValueFor(field.key, !!field.default)}
							/>
							<span class="toggle-text">
								<span class="lbl as-label">{field.label}</span>
								{#if field.help}<span class="adm-help">{field.help}</span>{/if}
							</span>
						</label>
					{:else if field.type === 'image'}
						<span class="lbl">{field.label}</span>
						{#if field.help}<p class="adm-help" style="margin-top:0; margin-bottom:6px">{field.help}</p>{/if}
						<ImageField
							name={`s::${field.key}`}
							value={valueFor(field.key, field.default)}
							prefix={settingPrefix(field.key)}
							label=""
						/>
					{:else if field.type === 'color'}
						<label for={`f-${field.key}`} class="lbl">{field.label}</label>
						<div class="color-row">
							<input
								type="color"
								class="color-swatch"
								value={valueFor(field.key, field.default) || '#000000'}
								oninput={(e) => {
									const hex = (e.currentTarget as HTMLInputElement).value;
									const text = (e.currentTarget.parentElement?.querySelector(
										'input[type="text"]'
									) as HTMLInputElement | null);
									if (text) text.value = hex;
								}}
								aria-label={`${field.label} swatch`}
							/>
							<input
								id={`f-${field.key}`}
								type="text"
								class="adm-input mono"
								name={`s::${field.key}`}
								value={valueFor(field.key, field.default)}
								placeholder="#000000"
								oninput={(e) => {
									const hex = (e.currentTarget as HTMLInputElement).value.trim();
									const swatch = (e.currentTarget.parentElement?.querySelector(
										'input[type="color"]'
									) as HTMLInputElement | null);
									if (swatch && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
										swatch.value = hex;
									}
								}}
							/>
						</div>
						{#if field.help}<p class="adm-help">{field.help}</p>{/if}
					{:else if field.type === 'select'}
						<label for={`f-${field.key}`} class="lbl">{field.label}</label>
						<select
							id={`f-${field.key}`}
							class="adm-select"
							name={`s::${field.key}`}
							value={valueFor(field.key, field.default)}
						>
							{#each field.options ?? [] as opt (opt.value)}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						{#if field.help}<p class="adm-help">{field.help}</p>{/if}
					{:else if field.type === 'textarea'}
						<label for={`f-${field.key}`} class="lbl">{field.label}</label>
						<textarea
							id={`f-${field.key}`}
							class="adm-textarea"
							name={`s::${field.key}`}
							value={valueFor(field.key, field.default)}
							rows="3"
						></textarea>
						{#if field.help}<p class="adm-help">{field.help}</p>{/if}
					{:else if field.type === 'number'}
						<label for={`f-${field.key}`} class="lbl">{field.label}</label>
						<input
							id={`f-${field.key}`}
							type="number"
							class="adm-input"
							name={`s::${field.key}`}
							value={valueFor(field.key, field.default)}
							min={field.min}
							max={field.max}
							step={field.step}
						/>
						{#if field.help}<p class="adm-help">{field.help}</p>{/if}
					{:else}
						<label for={`f-${field.key}`} class="lbl">{field.label}</label>
						<input
							id={`f-${field.key}`}
							type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
							class="adm-input"
							name={`s::${field.key}`}
							value={valueFor(field.key, field.default)}
						/>
						{#if field.help}<p class="adm-help">{field.help}</p>{/if}
					{/if}

					{#if errors[field.key]}
						<p class="field-error">{errors[field.key]}</p>
					{/if}
				</div>
			{/each}

			<div class="settings-actions">
				<button type="submit" class="adm-btn primary">
					<Icon name="check" size={14} stroke={2} />
					{t($i18n, 'admin.settings.save')}
				</button>
				<button
					type="submit"
					formaction="?/reset"
					class="adm-btn ghost"
					onclick={(e) => {
						if (!confirm(t($i18n, 'admin.settings.confirm_reset'))) e.preventDefault();
					}}
				>
					{t($i18n, 'admin.settings.reset_group')}
				</button>
			</div>
		</form>
	</section>
</div>

<style>
	.settings-shell {
		display: grid;
		grid-template-columns: 240px 1fr;
		gap: 24px;
		align-items: start;
	}
	@media (max-width: 880px) {
		.settings-shell {
			grid-template-columns: 1fr;
		}
	}

	.settings-tabs {
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: var(--paper);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 8px;
		box-shadow: var(--shadow-1);
		position: sticky;
		top: calc(var(--adm-topbar-h, 48px) + 16px);
	}
	.settings-tab {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		text-decoration: none;
		color: var(--fg-1);
		transition: background var(--dur-base) var(--ease-out);
	}
	.settings-tab:hover {
		background: var(--bone);
	}
	.settings-tab.active {
		background: var(--ink);
		color: var(--paper);
	}
	.settings-tab.active .t-desc {
		color: rgba(255, 255, 255, 0.7);
	}
	.settings-tab .t-label {
		font-family: var(--font-body);
		font-size: var(--fs-sm);
		font-weight: var(--fw-bold);
		letter-spacing: var(--tracking-caps);
		text-transform: uppercase;
	}
	.settings-tab .t-desc {
		font-size: var(--fs-xxs);
		color: var(--fg-3);
		line-height: 1.4;
	}

	.settings-panel {
		min-width: 0;
	}

	.settings-form {
		background: var(--paper);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 24px;
		box-shadow: var(--shadow-1);
		display: grid;
		gap: 20px;
	}

	.adm-field.has-error :global(.adm-input),
	.adm-field.has-error :global(.adm-select),
	.adm-field.has-error :global(.adm-textarea) {
		border-color: var(--danger);
	}
	.field-error {
		color: var(--danger);
		font-size: var(--fs-xs);
		margin: 6px 0 0;
		font-weight: var(--fw-semibold);
	}

	.toggle-row {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 12px;
		align-items: start;
		cursor: pointer;
	}
	.toggle-row input[type='checkbox'] {
		appearance: none;
		width: 38px;
		height: 22px;
		background: var(--hairline);
		border-radius: 999px;
		position: relative;
		cursor: pointer;
		margin-top: 2px;
		transition: background var(--dur-base) var(--ease-out);
		flex: none;
	}
	.toggle-row input[type='checkbox']::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: var(--paper);
		border-radius: 50%;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		transition: transform var(--dur-base) var(--ease-out);
	}
	.toggle-row input[type='checkbox']:checked {
		background: var(--accent);
	}
	.toggle-row input[type='checkbox']:checked::after {
		transform: translateX(16px);
	}
	.toggle-row input[type='checkbox']:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.22);
	}
	.toggle-row .toggle-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.toggle-row .as-label {
		font-family: var(--font-body);
		font-size: var(--fs-xs);
		font-weight: var(--fw-bold);
		color: var(--fg-2);
		letter-spacing: var(--tracking-caps);
		text-transform: uppercase;
		display: block;
		margin-bottom: 0;
	}

	.color-row {
		display: grid;
		grid-template-columns: 44px 1fr;
		gap: 8px;
		align-items: center;
	}
	.color-swatch {
		appearance: none;
		-webkit-appearance: none;
		width: 44px;
		height: 38px;
		border: 1.5px solid var(--border);
		border-radius: var(--radius-sm);
		background: transparent;
		cursor: pointer;
		padding: 2px;
	}
	.color-swatch::-webkit-color-swatch {
		border: none;
		border-radius: 2px;
	}
	.color-swatch::-moz-color-swatch {
		border: none;
		border-radius: 2px;
	}
	.mono {
		font-family: var(--font-mono);
	}

	.settings-actions {
		display: flex;
		gap: 10px;
		padding-top: 8px;
		border-top: 1px solid var(--border);
		margin-top: 4px;
	}
</style>
