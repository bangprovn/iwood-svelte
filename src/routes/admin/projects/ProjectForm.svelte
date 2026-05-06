<script lang="ts">
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';
	import { FormShell, FormSection, FormField, FormRow } from '$lib/components/admin/form';

	type Cat = { id: string; nameVi: string };
	type Product = { id: string; code: string; nameVi: string };
	type Props = {
		mode: 'new' | 'edit';
		title: string;
		subtitle?: string;
		categories: Cat[];
		products: Product[];
		values?: {
			id?: string;
			nameVi?: string;
			nameEn?: string;
			categoryId?: string;
			year?: number;
			area?: string;
			location?: string;
			imageUrl?: string;
			summaryVi?: string;
			summaryEn?: string | null;
			productIds?: string[];
		};
		errors?: Record<string, string>;
	};
	let {
		mode,
		title,
		subtitle,
		categories,
		products,
		values = {},
		errors = {}
	}: Props = $props();

	let imageUrl = $state(values.imageUrl ?? '');
	let summaryVi = $state(values.summaryVi ?? '');
	let summaryEn = $state(values.summaryEn ?? '');
	let selected = $state(new Set<string>(values.productIds ?? []));
	let filter = $state('');
	const filtered = $derived(
		products.filter((p) => {
			const q = filter.trim().toLowerCase();
			if (!q) return true;
			return p.code.toLowerCase().includes(q) || p.nameVi.toLowerCase().includes(q);
		})
	);
	function toggle(id: string) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}
</script>

<FormShell {title} {subtitle} {mode} backHref="/admin/projects" backLabel="Projects">
	<FormSection title="Names">
		<FormRow>
			<FormField label="Vietnamese" required>
				<input class="adm-input" name="nameVi" value={values.nameVi ?? ''} required />
			</FormField>
			<FormField label="English" required>
				<input class="adm-input" name="nameEn" value={values.nameEn ?? ''} required />
			</FormField>
		</FormRow>
		<FormRow>
			<FormField label="Area" required help="e.g. 1200 m²">
				<input class="adm-input" name="area" value={values.area ?? ''} placeholder="e.g. 1200 m²" required />
			</FormField>
			<FormField label="Location" required>
				<input class="adm-input" name="location" value={values.location ?? ''} required />
			</FormField>
		</FormRow>
	</FormSection>

	<FormSection title="Summary">
		<FormField label="Vietnamese" required>
			<RichTextEditor
				name="summaryVi"
				bind:value={summaryVi}
				placeholder="Tóm tắt dự án…"
				required
			/>
		</FormField>
		<FormField label="English">
			<RichTextEditor
				name="summaryEn"
				bind:value={summaryEn}
				placeholder="English summary (optional)…"
			/>
		</FormField>
	</FormSection>

	<FormSection title="Cover image">
		<ImageField name="imageUrl" bind:value={imageUrl} prefix="projects" required />
	</FormSection>

	<FormSection
		title="Linked products"
		description={`${selected.size} selected — these appear in the project page sidebar.`}
	>
		<input
			class="adm-input"
			placeholder="Filter by code or name…"
			bind:value={filter}
		/>
		<div class="picker">
			{#each filtered as p (p.id)}
				<label class="pick-row">
					<input
						type="checkbox"
						name="productIds"
						value={p.id}
						checked={selected.has(p.id)}
						onchange={() => toggle(p.id)}
					/>
					<code style="font-size:12px">{p.code}</code>
					<span>{p.nameVi}</span>
				</label>
			{:else}
				<p class="picker-empty">No products match.</p>
			{/each}
		</div>
	</FormSection>

	{#snippet sidebar()}
		<FormSection title="Identity" dense>
			<FormField
				label="ID (slug)"
				help={mode === 'edit'
					? 'Stable URL slug. Cannot be changed.'
					: 'Auto-derived from the English name if blank.'}
			>
				<input
					class="adm-input"
					name="id"
					value={values.id ?? ''}
					readonly={mode === 'edit'}
					placeholder="auto"
				/>
			</FormField>
			<FormField label="Year" required>
				<input
					class="adm-input"
					type="number"
					name="year"
					value={values.year ?? new Date().getFullYear()}
					required
				/>
			</FormField>
		</FormSection>

		<FormSection title="Category" dense>
			<FormField label="Category" required>
				<select class="adm-select" name="categoryId" required>
					<option value="" disabled selected={!values.categoryId}>— choose —</option>
					{#each categories as c (c.id)}
						<option value={c.id} selected={values.categoryId === c.id}>{c.nameVi}</option>
					{/each}
				</select>
			</FormField>
		</FormSection>
	{/snippet}
</FormShell>

<style>
	.picker {
		max-height: 320px;
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 6px;
		background: var(--paper);
	}
	.pick-row {
		display: grid;
		grid-template-columns: 20px 80px 1fr;
		gap: 8px;
		align-items: center;
		padding: 6px 8px;
		border-radius: var(--radius-xs);
		cursor: pointer;
		font-size: 13px;
		transition: background var(--dur-fast) var(--ease-out);
	}
	.pick-row:hover {
		background: var(--bone);
	}
	.pick-row input[type='checkbox'] {
		accent-color: var(--accent);
		cursor: pointer;
	}
	.picker-empty {
		color: var(--fg-3);
		font-size: 13px;
		margin: 8px;
	}
</style>
