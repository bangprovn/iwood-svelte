<script lang="ts">
	import ShowroomForm from '../ShowroomForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const initial = $derived({
		id: data.row.id,
		city: data.row.city,
		address: data.row.address,
		phone: data.row.phone,
		hours: data.row.hours,
		imageUrl: data.row.imageUrl,
		mapUrl: data.row.mapUrl,
		sortOrder: data.row.sortOrder
	});
</script>

<header class="adm-header">
	<div>
		<h1>Edit showroom</h1>
		<p>{data.row.city}</p>
	</div>
</header>

<ShowroomForm mode="edit" values={form?.values ?? initial} errors={form?.errors ?? {}} />
