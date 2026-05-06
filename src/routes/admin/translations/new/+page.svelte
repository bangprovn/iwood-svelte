<script lang="ts">
	import { FormShell, FormSection, FormField } from '$lib/components/admin/form';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
	const values = $derived(form?.values ?? {});
	const errors = $derived(form?.errors ?? {});
</script>

<FormShell
	mode="new"
	title="New translation key"
	subtitle="Create a key first, then edit per-locale values on the next page."
	backHref="/admin/translations"
	backLabel="Translations"
>
	<FormSection title="Key">
		<FormField
			label="Key"
			required
			help="Letters, numbers, dots, dashes and underscores. Used in t($i18n, '...')."
			error={errors.key}
		>
			<input
				class="adm-input"
				name="key"
				value={values.key ?? ''}
				placeholder="e.g. home.hero.title"
				required
			/>
		</FormField>
		<FormField label="Description" help="Optional context for translators.">
			<textarea class="adm-textarea" name="description">{values.description ?? ''}</textarea>
		</FormField>
	</FormSection>
</FormShell>
