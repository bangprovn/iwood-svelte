<script lang="ts">
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import { FormShell, FormSection, FormField, FormRow } from '$lib/components/admin/form';

	type Props = {
		mode: 'new' | 'edit';
		title: string;
		subtitle?: string;
		values?: {
			id?: string;
			nameVi?: string;
			nameEn?: string;
			blurb?: string;
			priceFrom?: number;
			imageUrl?: string;
			displayCount?: number;
			sortOrder?: number;
		};
		errors?: Record<string, string>;
	};
	let { mode, title, subtitle, values = {}, errors = {} }: Props = $props();
	let imageUrl = $state(values.imageUrl ?? '');
</script>

<FormShell
	{title}
	{subtitle}
	{mode}
	backHref="/admin/categories"
	backLabel="Categories"
>
	<FormSection title="Names" description="Display names shown across the site.">
		<FormRow>
			<FormField label="Vietnamese" required error={errors.nameVi}>
				<input class="adm-input" name="nameVi" value={values.nameVi ?? ''} required />
			</FormField>
			<FormField label="English" required error={errors.nameEn}>
				<input class="adm-input" name="nameEn" value={values.nameEn ?? ''} required />
			</FormField>
		</FormRow>
		<FormField label="Short blurb" required error={errors.blurb}>
			<textarea class="adm-textarea" name="blurb" required>{values.blurb ?? ''}</textarea>
		</FormField>
	</FormSection>

	<FormSection title="Image" description="Used on category cards and the mega menu.">
		<ImageField name="imageUrl" bind:value={imageUrl} prefix="categories" required />
		{#if errors.imageUrl}
			<p class="adm-field-error">{errors.imageUrl}</p>
		{/if}
	</FormSection>

	{#snippet sidebar()}
		<FormSection title="Identity" dense>
			<FormField
				label="ID (slug)"
				help={mode === 'edit'
					? 'Used in URLs/lookups. Cannot be changed.'
					: 'Auto-derived from the English name if blank.'}
			>
				<input
					class="adm-input"
					name="id"
					value={values.id ?? ''}
					readonly={mode === 'edit'}
					placeholder="auto from English name"
				/>
			</FormField>
			<FormField label="Sort order" help="Lower appears first.">
				<input
					class="adm-input"
					type="number"
					name="sortOrder"
					value={values.sortOrder ?? 0}
				/>
			</FormField>
		</FormSection>

		<FormSection title="Catalog" dense>
			<FormField label="Price from (VND)" required error={errors.priceFrom}>
				<input
					class="adm-input"
					type="number"
					name="priceFrom"
					value={values.priceFrom ?? 0}
					required
				/>
			</FormField>
			<FormField label="Display product count" help="Cosmetic — shown on category cards.">
				<input
					class="adm-input"
					type="number"
					name="displayCount"
					value={values.displayCount ?? 0}
				/>
			</FormField>
		</FormSection>
	{/snippet}
</FormShell>
