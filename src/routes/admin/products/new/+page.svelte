<script lang="ts">
	import ProductForm from '../ProductForm.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<ProductForm
	mode="new"
	title="New product"
	subtitle="Add a SKU to the catalog."
	categories={data.categories}
	values={form?.values ?? {}}
	errors={form?.errors ?? {}}
/>
