<script lang="ts">
	import ImageField from '$lib/components/admin/ImageField.svelte';

	type Props = {
		mode: 'new' | 'edit';
		values?: {
			id?: string;
			city?: string;
			address?: string;
			phone?: string;
			hours?: string;
			imageUrl?: string;
			mapUrl?: string | null;
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
				<input class="adm-input" name="id" value={values.id ?? ''} readonly={mode === 'edit'} placeholder="auto from city" />
			</div>
			<div class="adm-field">
				<label>Sort order</label>
				<input class="adm-input" type="number" name="sortOrder" value={values.sortOrder ?? 0} />
			</div>
		</div>
		<div class="row">
			<div class="adm-field">
				<label>City *</label>
				<input class="adm-input" name="city" value={values.city ?? ''} required />
				{#if errors.city}<p class="adm-help" style="color:var(--danger)">{errors.city}</p>{/if}
			</div>
			<div class="adm-field">
				<label>Phone *</label>
				<input class="adm-input" name="phone" value={values.phone ?? ''} required />
			</div>
		</div>
		<div class="adm-field">
			<label>Address *</label>
			<input class="adm-input" name="address" value={values.address ?? ''} required />
		</div>
		<div class="row">
			<div class="adm-field">
				<label>Hours *</label>
				<input class="adm-input" name="hours" value={values.hours ?? ''} required />
			</div>
			<div class="adm-field">
				<label>Map URL</label>
				<input class="adm-input" name="mapUrl" value={values.mapUrl ?? ''} placeholder="https://maps.google.com/…" />
			</div>
		</div>

		<ImageField name="imageUrl" bind:value={imageUrl} prefix="showrooms" required label="Image *" />

		<div style="display:flex; gap:10px; margin-top:8px">
			<button type="submit" class="adm-btn primary">{mode === 'new' ? 'Create' : 'Save changes'}</button>
			<a href="/admin/showrooms" class="adm-btn ghost">Cancel</a>
		</div>
	</form>
</div>
