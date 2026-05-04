<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editing = $state<string | null>(null);
</script>

<header class="adm-header">
	<div>
		<h1>Project categories</h1>
		<p>Filters used on /projects.</p>
	</div>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<div class="adm-card" style="margin-bottom: 18px">
	<h2 style="font-size:14px; margin:0 0 10px">Add new</h2>
	<form method="post" action="?/create" class="adm-form" use:enhance>
		<div class="row">
			<div class="adm-field">
				<label>ID (slug, optional)</label>
				<input class="adm-input" name="id" placeholder="auto" />
			</div>
			<div class="adm-field">
				<label>Sort order</label>
				<input class="adm-input" type="number" name="sortOrder" value="0" />
			</div>
		</div>
		<div class="row">
			<div class="adm-field">
				<label>Name (Vietnamese) *</label>
				<input class="adm-input" name="nameVi" required />
				{#if form?.scope === 'create' && form?.errors?.nameVi}
					<p class="adm-help" style="color:var(--danger)">{form.errors.nameVi}</p>
				{/if}
			</div>
			<div class="adm-field">
				<label>Name (English) *</label>
				<input class="adm-input" name="nameEn" required />
				{#if form?.scope === 'create' && form?.errors?.nameEn}
					<p class="adm-help" style="color:var(--danger)">{form.errors.nameEn}</p>
				{/if}
			</div>
		</div>
		<div><button class="adm-btn primary" type="submit">Add category</button></div>
	</form>
</div>

<table class="adm-table">
	<thead>
		<tr>
			<th>Sort</th><th>ID</th><th>Vietnamese</th><th>English</th><th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.id)}
			{#if editing === r.id}
				<tr>
					<td colspan="5">
						<form method="post" action="?/update" class="adm-form" use:enhance={() => async ({ result, update }) => {
							await update();
							if (result.type === 'success') editing = null;
						}}>
							<input type="hidden" name="id" value={r.id} />
							<div class="row">
								<div class="adm-field">
									<label>Sort</label>
									<input class="adm-input" type="number" name="sortOrder" value={r.sortOrder} />
								</div>
								<div class="adm-field">
									<label>Vietnamese</label>
									<input class="adm-input" name="nameVi" value={r.nameVi} required />
								</div>
								<div class="adm-field">
									<label>English</label>
									<input class="adm-input" name="nameEn" value={r.nameEn} required />
								</div>
							</div>
							<div style="display:flex; gap:8px">
								<button class="adm-btn primary" type="submit">Save</button>
								<button type="button" class="adm-btn ghost" onclick={() => (editing = null)}>Cancel</button>
							</div>
						</form>
					</td>
				</tr>
			{:else}
				<tr>
					<td>{r.sortOrder}</td>
					<td><code style="font-size:12px">{r.id}</code></td>
					<td>{r.nameVi}</td>
					<td>{r.nameEn}</td>
					<td class="row-actions">
						<button class="adm-btn sm ghost" onclick={() => (editing = r.id)}>Edit</button>
						<form
							method="post"
							action="?/delete"
							use:enhance={() => async ({ update }) => {
								if (confirm(`Delete "${r.nameVi}"?`)) await update();
							}}
							style="display:inline"
						>
							<input type="hidden" name="id" value={r.id} />
							<button class="adm-btn sm danger" type="submit">Delete</button>
						</form>
					</td>
				</tr>
			{/if}
		{:else}
			<tr><td colspan="5" style="text-align:center; color:var(--fg-3); padding:20px">None yet.</td></tr>
		{/each}
	</tbody>
</table>
