<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<header class="adm-header">
	<div>
		<h1>Edit translation</h1>
		<p><code>{data.row.key}</code></p>
	</div>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}
{#if form?.success}<p class="adm-help" style="color:var(--ok)">Saved.</p>{/if}

<div class="adm-card">
	<form method="post" action="?/save" class="adm-form">
		<div class="adm-field">
			<label>Description</label>
			<textarea class="adm-textarea" name="description">{data.row.description ?? ''}</textarea>
		</div>

		{#each data.locales as locale (locale.code)}
			<div class="adm-field">
				<label>
					{locale.label} <code style="font-size:12px">({locale.code})</code>
					{#if !locale.isActive}<span class="adm-badge">inactive</span>{/if}
				</label>
				<textarea class="adm-textarea" name={`value:${locale.code}`}
					>{data.row.values[locale.code] ?? ''}</textarea
				>
				<p class="adm-help">
					Use <code>{`{name}`}</code>-style placeholders. Empty = fall back to default locale.
				</p>
			</div>
		{/each}

		<div class="adm-field">
			<label>Rename key</label>
			<input class="adm-input" name="renameTo" value={data.row.key} />
			<p class="adm-help">Changing this renames the key (cascades to all locales).</p>
		</div>

		<div style="display:flex; gap:10px; margin-top:8px">
			<button type="submit" class="adm-btn primary">Save changes</button>
			<a href="/admin/translations" class="adm-btn ghost">Cancel</a>
		</div>
	</form>
</div>

<form
	method="post"
	action="?/delete"
	use:enhance={() =>
		async ({ update }) => {
			if (confirm(`Delete key "${data.row.key}" and all its values?`)) await update();
		}}
	style="margin-top:16px"
>
	<button type="submit" class="adm-btn danger">Delete this key</button>
</form>
