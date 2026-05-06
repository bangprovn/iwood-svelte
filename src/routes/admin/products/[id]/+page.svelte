<script lang="ts">
	import ProductForm from '../ProductForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const initial = $derived({
		id: data.row.id,
		code: data.row.code,
		nameVi: data.row.nameVi,
		nameEn: data.row.nameEn,
		categoryId: data.row.categoryId,
		price: data.row.price,
		imageUrl: data.row.imageUrl,
		tag: data.row.tag,
		descVi: data.row.descVi,
		descEn: data.row.descEn,
		specs: data.row.specs
	});
</script>

<ProductForm
	mode="edit"
	title="Edit product"
	subtitle={`${data.row.nameVi} · ${data.row.code}`}
	categories={data.categories}
	values={form?.values ?? initial}
	errors={form?.errors ?? {}}
/>
