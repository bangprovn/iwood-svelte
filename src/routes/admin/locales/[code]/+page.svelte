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

<LocaleForm
	mode="edit"
	title="Edit locale"
	subtitle={`${data.row.label} (${data.row.code})`}
	values={form?.values ?? initial}
	errors={form?.errors ?? {}}
/>
