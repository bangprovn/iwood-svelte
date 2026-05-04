<script lang="ts">
	import ShowroomForm from '../ShowroomForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<header class="adm-header">
	<div>
		<h1>New showroom</h1>
		<p>A physical location.</p>
	</div>
</header>

<ShowroomForm mode="new" values={form?.values ?? {}} errors={form?.errors ?? {}} />
