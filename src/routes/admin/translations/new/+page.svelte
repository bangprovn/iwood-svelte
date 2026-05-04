<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
	const values = $derived(form?.values ?? {});
	const errors = $derived(form?.errors ?? {});
</script>

<header class="adm-header">
	<div>
		<h1>New translation key</h1>
		<p>Create a key first, then edit per-locale values on the next page.</p>
	</div>
</header>

<div class="adm-card">
	<form method="post" class="adm-form">
		<div class="adm-field">
			<label>Key *</label>
			<input
				class="adm-input"
				name="key"
				value={values.key ?? ''}
				placeholder="e.g. home.hero.title"
				required
			/>
			<p class="adm-help">
				Letters, numbers, dots, dashes and underscores. Used in <code>t($i18n, '...')</code>.
			</p>
			{#if errors.key}<p class="adm-help" style="color:var(--danger)">{errors.key}</p>{/if}
		</div>

		<div class="adm-field">
			<label>Description</label>
			<textarea class="adm-textarea" name="description">{values.description ?? ''}</textarea>
			<p class="adm-help">Optional context for translators.</p>
		</div>

		<div style="display:flex; gap:10px; margin-top:8px">
			<button type="submit" class="adm-btn primary">Create</button>
			<a href="/admin/translations" class="adm-btn ghost">Cancel</a>
		</div>
	</form>
</div>
