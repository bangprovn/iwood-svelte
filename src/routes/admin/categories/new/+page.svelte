<script lang="ts">
	import CategoryForm from '../CategoryForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<CategoryForm
	mode="new"
	title="New category"
	subtitle="Top-level catalog grouping shown on /products and the mega menu."
	values={form?.values ?? {}}
	errors={form?.errors ?? {}}
/>
