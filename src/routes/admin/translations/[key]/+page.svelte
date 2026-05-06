<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormShell, FormSection, FormField } from '$lib/components/admin/form';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<FormShell
	mode="edit"
	title="Edit translation"
	subtitle={data.row.key}
	backHref="/admin/translations"
	backLabel="Translations"
	action="?/save"
	error={form?.message}
	flash={form?.success ? 'Saved.' : undefined}
>
	<FormSection
		title="Translations"
		description='Use {name}-style placeholders. Empty value = fall back to default locale.'
	>
		{#each data.locales as locale (locale.code)}
			<FormField
				label={locale.label + ' (' + locale.code + ')' + (locale.isActive ? '' : ' — inactive')}
			>
				<textarea class="adm-textarea" name={`value:${locale.code}`}
					>{data.row.values[locale.code] ?? ''}</textarea
				>
			</FormField>
		{/each}
	</FormSection>

	<FormSection title="Notes">
		<FormField label="Description" help="Optional context for translators.">
			<textarea class="adm-textarea" name="description">{data.row.description ?? ''}</textarea>
		</FormField>
	</FormSection>

	{#snippet sidebar()}
		<FormSection title="Key" dense>
			<FormField label="Rename key" help="Cascades to all locales.">
				<input class="adm-input" name="renameTo" value={data.row.key} />
			</FormField>
		</FormSection>
	{/snippet}
</FormShell>

<form
	method="post"
	action="?/delete"
	class="adm-form-danger-zone"
	use:enhance={() =>
		async ({ update }) => {
			if (confirm(`Delete key "${data.row.key}" and all its values?`)) await update();
		}}
>
	<div>
		<h3>Danger zone</h3>
		<p>Removes this key and every translated value across all locales.</p>
	</div>
	<button type="submit" class="adm-btn danger">Delete this key</button>
</form>

<style>
	.adm-form-danger-zone {
		margin-top: 28px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		padding: 16px 20px;
		background: var(--paper);
		border: 1px solid var(--border);
		border-left: 3px solid var(--danger);
		border-radius: var(--radius-md);
		flex-wrap: wrap;
	}
	.adm-form-danger-zone h3 {
		margin: 0 0 2px;
		font-size: var(--fs-sm);
		font-weight: var(--fw-bold);
		color: var(--fg-1);
	}
	.adm-form-danger-zone p {
		margin: 0;
		font-size: var(--fs-xs);
		color: var(--fg-3);
	}
</style>
