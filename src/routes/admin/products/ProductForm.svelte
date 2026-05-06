<script lang="ts">
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import TagInput from '$lib/components/admin/TagInput.svelte';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';
	import { FormShell, FormSection, FormField, FormRow } from '$lib/components/admin/form';

	type Cat = { id: string; nameVi: string };
	type Props = {
		mode: 'new' | 'edit';
		title: string;
		subtitle?: string;
		categories: Cat[];
		values?: {
			id?: string;
			code?: string;
			nameVi?: string;
			nameEn?: string;
			categoryId?: string;
			price?: number;
			imageUrl?: string;
			tag?: string | null;
			descVi?: string;
			descEn?: string | null;
			specs?: string[];
		};
		errors?: Record<string, string>;
	};
	let { mode, title, subtitle, categories, values = {}, errors = {} }: Props = $props();

	let imageUrl = $state(values.imageUrl ?? '');
	let specs = $state<string[]>(values.specs ?? []);
	let descVi = $state(values.descVi ?? '');
	let descEn = $state(values.descEn ?? '');
</script>

<FormShell {title} {subtitle} {mode} backHref="/admin/products" backLabel="Products">
	<FormSection title="Names" description="Display names shown across the catalog.">
		<FormRow>
			<FormField label="Vietnamese" required error={errors.nameVi}>
				<input class="adm-input" name="nameVi" value={values.nameVi ?? ''} required />
			</FormField>
			<FormField label="English" required error={errors.nameEn}>
				<input class="adm-input" name="nameEn" value={values.nameEn ?? ''} required />
			</FormField>
		</FormRow>
	</FormSection>

	<FormSection title="Description">
		<FormField label="Vietnamese" required error={errors.descVi}>
			<RichTextEditor
				name="descVi"
				bind:value={descVi}
				placeholder="Mô tả sản phẩm…"
				required
			/>
		</FormField>
		<FormField label="English">
			<RichTextEditor
				name="descEn"
				bind:value={descEn}
				placeholder="English description (optional)…"
			/>
		</FormField>
	</FormSection>

	<FormSection title="Image">
		<ImageField name="imageUrl" bind:value={imageUrl} prefix="products" required />
		{#if errors.imageUrl}<p class="adm-field-error">{errors.imageUrl}</p>{/if}
	</FormSection>

	<FormSection title="Specs" description="Chips shown on the product detail page.">
		<TagInput name="specs" bind:values={specs} label="" />
	</FormSection>

	{#snippet sidebar()}
		<FormSection title="Identity" dense>
			<FormField
				label="ID (slug)"
				help={mode === 'edit'
					? 'Stable ID used in URLs. Cannot be changed.'
					: 'Auto-derived from the SKU if blank.'}
			>
				<input
					class="adm-input"
					name="id"
					value={values.id ?? ''}
					readonly={mode === 'edit'}
					placeholder="auto from code"
				/>
			</FormField>
			<FormField label="Code (SKU)" required error={errors.code}>
				<input class="adm-input" name="code" value={values.code ?? ''} required />
			</FormField>
		</FormSection>

		<FormSection title="Catalog" dense>
			<FormField label="Category" required error={errors.categoryId}>
				<select class="adm-select" name="categoryId" required>
					<option value="" disabled selected={!values.categoryId}>— choose —</option>
					{#each categories as c (c.id)}
						<option value={c.id} selected={values.categoryId === c.id}>{c.nameVi}</option>
					{/each}
				</select>
			</FormField>
			<FormField label="Price (VND)" required error={errors.price}>
				<input
					class="adm-input"
					type="number"
					name="price"
					value={values.price ?? 0}
					required
				/>
			</FormField>
			<FormField label="Tag" help="Optional marketing label, e.g. Bestseller.">
				<input class="adm-input" name="tag" value={values.tag ?? ''} placeholder="e.g. Bestseller" />
			</FormField>
		</FormSection>
	{/snippet}
</FormShell>
