<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<header class="adm-header">
	<div>
		<h1>Locales</h1>
		<p>The set of languages available on the public site. Default locale URLs have no prefix.</p>
	</div>
	<a href="/admin/locales/new" class="adm-btn primary">+ New locale</a>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th>Code</th>
			<th>Label</th>
			<th>Dir</th>
			<th>Active</th>
			<th>Default</th>
			<th>Sort</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.code)}
			<tr>
				<td><code>{r.code}</code></td>
				<td><strong>{r.label}</strong></td>
				<td>{r.dir}</td>
				<td>{r.isActive ? 'Yes' : 'No'}</td>
				<td>
					{#if r.isDefault}
						<span class="adm-badge">Default</span>
					{:else}
						<form
							method="post"
							action="?/setDefault"
							use:enhance={() =>
								async ({ update }) => {
									await update();
								}}
							style="display:inline"
						>
							<input type="hidden" name="code" value={r.code} />
							<button type="submit" class="adm-btn sm ghost">Set as default</button>
						</form>
					{/if}
				</td>
				<td>{r.sortOrder}</td>
				<td class="row-actions">
					<a class="adm-btn sm ghost" href={`/admin/locales/${r.code}`}>Edit</a>
					{#if !r.isDefault}
						<form
							method="post"
							action="?/delete"
							use:enhance={() =>
								async ({ update }) => {
									if (
										confirm(
											`Delete locale "${r.code}"? Translations for this locale will be removed.`
										)
									)
										await update();
								}}
							style="display:inline"
						>
							<input type="hidden" name="code" value={r.code} />
							<button type="submit" class="adm-btn sm danger">Delete</button>
						</form>
					{/if}
				</td>
			</tr>
		{:else}
			<tr
				><td colspan="7" style="text-align:center; color:var(--fg-3); padding:24px"
					>No locales yet.</td
				></tr
			>
		{/each}
	</tbody>
</table>
