<script lang="ts">
	import LocaleForm from '../LocaleForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const initial = $derived({
		code: data.row.code,
		label: data.row.label,
		dir: (data.row.dir === 'rtl' ? 'rtl' : 'ltr') as 'ltr' | 'rtl',
		isActive: data.row.isActive,
		isDefault: data.row.isDefault,
		sortOrder: data.row.sortOrder
	});
</script>

<header class="adm-header">
	<div>
		<h1>Edit locale</h1>
		<p>{data.row.label} (<code>{data.row.code}</code>)</p>
	</div>
</header>

<LocaleForm mode="edit" values={form?.values ?? initial} errors={form?.errors ?? {}} />
