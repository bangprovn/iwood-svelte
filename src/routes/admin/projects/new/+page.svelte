<script lang="ts">
	import ProjectForm from '../ProjectForm.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<ProjectForm
	mode="new"
	title="New project"
	subtitle="Add a project case study."
	categories={data.categories}
	products={data.products}
	values={form?.values ?? {}}
	errors={form?.errors ?? {}}
/>
