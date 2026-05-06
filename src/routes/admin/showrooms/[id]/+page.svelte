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

<ShowroomForm
	mode="edit"
	title="Edit showroom"
	subtitle={data.row.city}
	values={form?.values ?? initial}
	errors={form?.errors ?? {}}
/>
