<script lang="ts">
	import ProductForm from '../ProductForm.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<header class="adm-header">
	<div>
		<h1>New product</h1>
		<p>Add a SKU to the catalog.</p>
	</div>
</header>

<ProductForm
	mode="new"
	categories={data.categories}
	values={form?.values ?? {}}
	errors={form?.errors ?? {}}
/>
