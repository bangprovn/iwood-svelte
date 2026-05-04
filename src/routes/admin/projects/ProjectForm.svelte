<script lang="ts">
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';

	type Cat = { id: string; nameVi: string };
	type Product = { id: string; code: string; nameVi: string };
	type Props = {
		mode: 'new' | 'edit';
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
	let { mode, categories, products, values = {}, errors = {} }: Props = $props();

	let imageUrl = $state(values.imageUrl ?? '');
	let summaryVi = $state(values.summaryVi ?? '');
	let summaryEn = $state(values.summaryEn ?? '');
	let selected = $state(new Set<string>(values.productIds ?? []));
	let filter = $state('');
	const filtered = $derived(
		products.filter((p) => {
			const q = filter.trim().toLowerCase();
			if (!q) return true;
			return (
				p.code.toLowerCase().includes(q) ||
				p.nameVi.toLowerCase().includes(q)
			);
		})
	);
	function toggle(id: string) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}
</script>

<div class="adm-card">
	<form method="post" class="adm-form">
		<div class="row">
			<div class="adm-field">
				<label>ID (slug)</label>
				<input
					class="adm-input"
					name="id"
					value={values.id ?? ''}
					readonly={mode === 'edit'}
					placeholder="auto"
				/>
			</div>
			<div class="adm-field">
				<label>Year *</label>
				<input class="adm-input" type="number" name="year" value={values.year ?? new Date().getFullYear()} required />
			</div>
		</div>

		<div class="row">
			<div class="adm-field">
				<label>Name (Vietnamese) *</label>
				<input class="adm-input" name="nameVi" value={values.nameVi ?? ''} required />
			</div>
			<div class="adm-field">
				<label>Name (English) *</label>
				<input class="adm-input" name="nameEn" value={values.nameEn ?? ''} required />
			</div>
		</div>

		<div class="row">
			<div class="adm-field">
				<label>Category *</label>
				<select class="adm-select" name="categoryId" required>
					<option value="" disabled selected={!values.categoryId}>— choose —</option>
					{#each categories as c (c.id)}
						<option value={c.id} selected={values.categoryId === c.id}>{c.nameVi}</option>
					{/each}
				</select>
			</div>
			<div class="adm-field">
				<label>Area *</label>
				<input class="adm-input" name="area" value={values.area ?? ''} placeholder="e.g. 1200 m²" required />
			</div>
		</div>

		<div class="adm-field">
			<label>Location *</label>
			<input class="adm-input" name="location" value={values.location ?? ''} required />
		</div>

		<div class="adm-field">
			<label>Summary (Vietnamese) *</label>
			<RichTextEditor name="summaryVi" bind:value={summaryVi} placeholder="Tóm tắt dự án…" required />
		</div>
		<div class="adm-field">
			<label>Summary (English)</label>
			<RichTextEditor name="summaryEn" bind:value={summaryEn} placeholder="English summary (optional)…" />
		</div>

		<ImageField name="imageUrl" bind:value={imageUrl} prefix="projects" required label="Image *" />

		<div class="adm-field">
			<div class="lbl">Linked products ({selected.size} selected)</div>
			<input class="adm-input" placeholder="Filter by code or name…" bind:value={filter} style="margin-bottom:8px" />
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
					<p style="color:var(--fg-3); font-size:13px; margin:4px">No products match.</p>
				{/each}
			</div>
		</div>

		<div style="display:flex; gap:10px; margin-top:8px">
			<button type="submit" class="adm-btn primary">{mode === 'new' ? 'Create' : 'Save changes'}</button>
			<a href="/admin/projects" class="adm-btn ghost">Cancel</a>
		</div>
	</form>
</div>

<style>
	.picker {
		max-height: 280px;
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
		padding: 5px 6px;
		border-radius: var(--radius-xs);
		cursor: pointer;
		font-size: 13px;
	}
	.pick-row:hover {
		background: var(--bone);
	}
</style>
