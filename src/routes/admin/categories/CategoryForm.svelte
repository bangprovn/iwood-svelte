<script lang="ts">
	import ImageField from '$lib/components/admin/ImageField.svelte';

	type Props = {
		mode: 'new' | 'edit';
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
	let { mode, values = {}, errors = {} }: Props = $props();
	let imageUrl = $state(values.imageUrl ?? '');
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
					placeholder="auto from English name"
				/>
				<p class="adm-help">Used in URLs/lookups. Cannot be changed once created.</p>
			</div>
			<div class="adm-field">
				<label>Sort order</label>
				<input class="adm-input" type="number" name="sortOrder" value={values.sortOrder ?? 0} />
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

		<div class="adm-field">
			<label>Short blurb *</label>
			<textarea class="adm-textarea" name="blurb" required>{values.blurb ?? ''}</textarea>
			{#if errors.blurb}<p class="adm-help" style="color:var(--danger)">{errors.blurb}</p>{/if}
		</div>

		<div class="row">
			<div class="adm-field">
				<label>Price from (VND) *</label>
				<input class="adm-input" type="number" name="priceFrom" value={values.priceFrom ?? 0} required />
			</div>
			<div class="adm-field">
				<label>Display product count</label>
				<input
					class="adm-input"
					type="number"
					name="displayCount"
					value={values.displayCount ?? 0}
				/>
				<p class="adm-help">Shown on category cards (cosmetic).</p>
			</div>
		</div>

		<ImageField name="imageUrl" bind:value={imageUrl} prefix="categories" required label="Image *" />
		{#if errors.imageUrl}<p class="adm-help" style="color:var(--danger)">{errors.imageUrl}</p>{/if}

		<div style="display:flex; gap:10px; margin-top:8px">
			<button type="submit" class="adm-btn primary">{mode === 'new' ? 'Create' : 'Save changes'}</button>
			<a href="/admin/categories" class="adm-btn ghost">Cancel</a>
		</div>
	</form>
</div>
