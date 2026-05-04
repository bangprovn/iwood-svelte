<script lang="ts">
	import ProjectForm from '../ProjectForm.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<header class="adm-header">
	<div>
		<h1>New project</h1>
		<p>Add a project case study.</p>
	</div>
</header>

<ProjectForm
	mode="new"
	categories={data.categories}
	products={data.products}
	values={form?.values ?? {}}
	errors={form?.errors ?? {}}
/>
