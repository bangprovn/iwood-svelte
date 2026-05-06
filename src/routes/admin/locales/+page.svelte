<script lang="ts">
	import { enhance } from '$app/forms';
	import { useI18n, t } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const i18n = useI18n();
</script>

<header class="adm-header">
	<div>
		<h1>{t($i18n, 'admin.locales.title')}</h1>
		<p>{t($i18n, 'admin.locales.sub')}</p>
	</div>
	<a href="/admin/locales/new" class="adm-btn primary">{t($i18n, 'admin.locales.new')}</a>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th>{t($i18n, 'admin.locales.col_code')}</th>
			<th>{t($i18n, 'admin.locales.col_label')}</th>
			<th>{t($i18n, 'admin.locales.col_dir')}</th>
			<th>{t($i18n, 'admin.locales.col_active')}</th>
			<th>{t($i18n, 'admin.locales.col_default')}</th>
			<th>{t($i18n, 'admin.locales.col_sort')}</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.code)}
			<tr>
				<td><code>{r.code}</code></td>
				<td><strong>{r.label}</strong></td>
				<td>{r.dir}</td>
				<td>{r.isActive ? t($i18n, 'admin.common.yes') : t($i18n, 'admin.common.no')}</td>
				<td>
					{#if r.isDefault}
						<span class="adm-badge">{t($i18n, 'admin.locales.badge_default')}</span>
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
							<button type="submit" class="adm-btn sm ghost"
								>{t($i18n, 'admin.locales.set_default')}</button
							>
						</form>
					{/if}
				</td>
				<td>{r.sortOrder}</td>
				<td class="row-actions">
					<a class="adm-btn sm ghost" href={`/admin/locales/${r.code}`}
						>{t($i18n, 'admin.common.edit')}</a
					>
					{#if !r.isDefault}
						<form
							method="post"
							action="?/delete"
							use:enhance={() =>
								async ({ update }) => {
									if (confirm(t($i18n, 'admin.locales.confirm_delete', { code: r.code })))
										await update();
								}}
							style="display:inline"
						>
							<input type="hidden" name="code" value={r.code} />
							<button type="submit" class="adm-btn sm danger"
								>{t($i18n, 'admin.common.delete')}</button
							>
						</form>
					{/if}
				</td>
			</tr>
		{:else}
			<tr
				><td colspan="7" style="text-align:center; color:var(--fg-3); padding:24px"
					>{t($i18n, 'admin.locales.empty')}</td
				></tr
			>
		{/each}
	</tbody>
</table>
