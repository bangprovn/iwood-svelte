<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));
	const activeLocales = $derived(data.locales.filter((l) => l.isActive));

	function preview(value: string | undefined): string {
		if (!value) return '';
		return value.length > 80 ? value.slice(0, 77) + '…' : value;
	}
</script>

<header class="adm-header">
	<div>
		<h1>Translations</h1>
		<p>Message keys and their per-locale values. Empty values fall back to the default locale.</p>
	</div>
	<div style="display:flex; gap:8px">
		<a href="/admin/translations/new" class="adm-btn primary">+ New key</a>
		<details class="adm-card" style="padding:8px 12px">
			<summary style="cursor:pointer">Import / Export</summary>
			<div style="display:flex; flex-direction:column; gap:6px; margin-top:8px">
				{#each activeLocales as locale (locale.code)}
					<a class="adm-btn sm ghost" href={`/admin/api/translations/export?locale=${locale.code}`}
						>Export {locale.code}.json</a
					>
				{/each}
				<form
					method="post"
					action="/admin/api/translations/import"
					enctype="multipart/form-data"
					style="display:flex; gap:6px; align-items:center; margin-top:6px"
				>
					<select class="adm-input" name="locale" style="width:auto">
						{#each activeLocales as locale (locale.code)}
							<option value={locale.code}>{locale.code}</option>
						{/each}
					</select>
					<select class="adm-input" name="mode" style="width:auto">
						<option value="merge">merge</option>
						<option value="replace">replace</option>
					</select>
					<input class="adm-input" type="file" name="file" accept="application/json" required />
					<button type="submit" class="adm-btn sm">Import</button>
				</form>
			</div>
		</details>
	</div>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<form method="get" style="margin-bottom:12px; display:flex; gap:8px">
	<input class="adm-input" name="q" placeholder="Search keys or descriptions" value={data.search} />
	<button type="submit" class="adm-btn">Search</button>
	{#if data.search}<a class="adm-btn ghost" href="/admin/translations">Clear</a>{/if}
</form>

<table class="adm-table">
	<thead>
		<tr>
			<th>Key</th>
			{#each activeLocales as locale (locale.code)}
				<th>{locale.code}</th>
			{/each}
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.key)}
			<tr>
				<td>
					<code style="font-size:12px">{r.key}</code>
					{#if r.description}<br /><span style="color:var(--fg-3); font-size:12px"
							>{r.description}</span
						>{/if}
				</td>
				{#each activeLocales as locale (locale.code)}
					<td>
						{#if r.values[locale.code]}
							{preview(r.values[locale.code])}
						{:else}
							<span style="color:var(--danger); font-size:12px">missing</span>
						{/if}
					</td>
				{/each}
				<td class="row-actions">
					<a class="adm-btn sm ghost" href={`/admin/translations/${encodeURIComponent(r.key)}`}
						>Edit</a
					>
					<form
						method="post"
						action="?/delete"
						use:enhance={() =>
							async ({ update }) => {
								if (confirm(`Delete key "${r.key}" and all its values?`)) await update();
							}}
						style="display:inline"
					>
						<input type="hidden" name="key" value={r.key} />
						<button type="submit" class="adm-btn sm danger">Delete</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr
				><td
					colspan={activeLocales.length + 2}
					style="text-align:center; color:var(--fg-3); padding:24px">No translation keys yet.</td
				></tr
			>
		{/each}
	</tbody>
</table>

{#if totalPages > 1}
	<div style="display:flex; gap:8px; margin-top:12px">
		{#each Array(totalPages) as _, i (i)}
			{@const p = i + 1}
			<a
				class="adm-btn sm {p === data.page ? 'primary' : 'ghost'}"
				href={`?page=${p}${data.search ? `&q=${encodeURIComponent(data.search)}` : ''}`}>{p}</a
			>
		{/each}
	</div>
{/if}
