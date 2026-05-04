<script lang="ts">
	import CategoryForm from '../CategoryForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<header class="adm-header">
	<div>
		<h1>New category</h1>
		<p>Top-level catalog grouping.</p>
	</div>
</header>

<CategoryForm mode="new" values={form?.values ?? {}} errors={form?.errors ?? {}} />
