<script lang="ts">
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import TagInput from '$lib/components/admin/TagInput.svelte';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';

	type Cat = { id: string; nameVi: string };
	type Props = {
		mode: 'new' | 'edit';
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
	let { mode, categories, values = {}, errors = {} }: Props = $props();

	let imageUrl = $state(values.imageUrl ?? '');
	let specs = $state<string[]>(values.specs ?? []);
	let descVi = $state(values.descVi ?? '');
	let descEn = $state(values.descEn ?? '');
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
					placeholder="auto from code"
				/>
				<p class="adm-help">Stable ID used in URLs.</p>
			</div>
			<div class="adm-field">
				<label>Code (SKU) *</label>
				<input class="adm-input" name="code" value={values.code ?? ''} required />
				{#if errors.code}<p class="adm-help" style="color:var(--danger)">{errors.code}</p>{/if}
			</div>
		</div>

		<div class="row">
			<div class="adm-field">
				<label>Name (Vietnamese) *</label>
				<input class="adm-input" name="nameVi" value={values.nameVi ?? ''} required />
				{#if errors.nameVi}<p class="adm-help" style="color:var(--danger)">{errors.nameVi}</p>{/if}
			</div>
			<div class="adm-field">
				<label>Name (English) *</label>
				<input class="adm-input" name="nameEn" value={values.nameEn ?? ''} required />
				{#if errors.nameEn}<p class="adm-help" style="color:var(--danger)">{errors.nameEn}</p>{/if}
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
				{#if errors.categoryId}<p class="adm-help" style="color:var(--danger)">{errors.categoryId}</p>{/if}
			</div>
			<div class="adm-field">
				<label>Price (VND) *</label>
				<input class="adm-input" type="number" name="price" value={values.price ?? 0} required />
				{#if errors.price}<p class="adm-help" style="color:var(--danger)">{errors.price}</p>{/if}
			</div>
		</div>

		<div class="adm-field">
			<label>Tag (optional)</label>
			<input class="adm-input" name="tag" value={values.tag ?? ''} placeholder="e.g. Bestseller" />
		</div>

		<div class="adm-field">
			<label>Description (Vietnamese) *</label>
			<RichTextEditor name="descVi" bind:value={descVi} placeholder="Mô tả sản phẩm…" required />
			{#if errors.descVi}<p class="adm-help" style="color:var(--danger)">{errors.descVi}</p>{/if}
		</div>

		<div class="adm-field">
			<label>Description (English)</label>
			<RichTextEditor name="descEn" bind:value={descEn} placeholder="English description (optional)…" />
		</div>

		<ImageField name="imageUrl" bind:value={imageUrl} prefix="products" required label="Image *" />
		{#if errors.imageUrl}<p class="adm-help" style="color:var(--danger)">{errors.imageUrl}</p>{/if}

		<TagInput name="specs" bind:values={specs} label="Specs (chips — Enter to add)" />

		<div style="display:flex; gap:10px; margin-top:8px">
			<button type="submit" class="adm-btn primary">{mode === 'new' ? 'Create' : 'Save changes'}</button>
			<a href="/admin/products" class="adm-btn ghost">Cancel</a>
		</div>
	</form>
</div>
