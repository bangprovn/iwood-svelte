<script lang="ts">
	import CategoryForm from '../CategoryForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const initial = $derived({
		id: data.row.id,
		nameVi: data.row.nameVi,
		nameEn: data.row.nameEn,
		blurb: data.row.blurb,
		priceFrom: data.row.priceFrom,
		imageUrl: data.row.imageUrl,
		displayCount: data.row.displayCount,
		sortOrder: data.row.sortOrder
	});
</script>

<header class="adm-header">
	<div>
		<h1>Edit category</h1>
		<p>{data.row.nameVi}</p>
	</div>
</header>

<CategoryForm mode="edit" values={form?.values ?? initial} errors={form?.errors ?? {}} />
