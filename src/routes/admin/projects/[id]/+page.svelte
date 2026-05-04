<script lang="ts">
	import ProjectForm from '../ProjectForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const initial = $derived({
		id: data.row.id,
		nameVi: data.row.nameVi,
		nameEn: data.row.nameEn,
		categoryId: data.row.categoryId,
		year: data.row.year,
		area: data.row.area,
		location: data.row.location,
		imageUrl: data.row.imageUrl,
		summaryVi: data.row.summaryVi,
		summaryEn: data.row.summaryEn,
		productIds: data.row.productIds
	});
</script>

<header class="adm-header">
	<div>
		<h1>Edit project</h1>
		<p>{data.row.nameVi}</p>
	</div>
</header>

<ProjectForm
	mode="edit"
	categories={data.categories}
	products={data.products}
	values={form?.values ?? initial}
	errors={form?.errors ?? {}}
/>
