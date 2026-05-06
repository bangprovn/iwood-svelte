<script lang="ts">
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import { FormShell, FormSection, FormField, FormRow } from '$lib/components/admin/form';

	type Props = {
		mode: 'new' | 'edit';
		title: string;
		subtitle?: string;
		values?: {
			id?: string;
			city?: string;
			address?: string;
			phone?: string;
			hours?: string;
			imageUrl?: string;
			mapUrl?: string | null;
			sortOrder?: number;
		};
		errors?: Record<string, string>;
	};
	let { mode, title, subtitle, values = {}, errors = {} }: Props = $props();
	let imageUrl = $state(values.imageUrl ?? '');
</script>

<FormShell {title} {subtitle} {mode} backHref="/admin/showrooms" backLabel="Showrooms">
	<FormSection title="Location">
		<FormField label="City" required error={errors.city}>
			<input class="adm-input" name="city" value={values.city ?? ''} required />
		</FormField>
		<FormField label="Address" required>
			<input class="adm-input" name="address" value={values.address ?? ''} required />
		</FormField>
		<FormRow>
			<FormField label="Phone" required>
				<input class="adm-input" name="phone" value={values.phone ?? ''} required />
			</FormField>
			<FormField label="Hours" required>
				<input class="adm-input" name="hours" value={values.hours ?? ''} required />
			</FormField>
		</FormRow>
		<FormField label="Map URL" help="Google Maps share link.">
			<input
				class="adm-input"
				name="mapUrl"
				value={values.mapUrl ?? ''}
				placeholder="https://maps.google.com/…"
			/>
		</FormField>
	</FormSection>

	<FormSection title="Image">
		<ImageField name="imageUrl" bind:value={imageUrl} prefix="showrooms" required />
	</FormSection>

	{#snippet sidebar()}
		<FormSection title="Identity" dense>
			<FormField
				label="ID (slug)"
				help={mode === 'edit'
					? 'Stable ID. Cannot be changed.'
					: 'Auto-derived from the city if blank.'}
			>
				<input
					class="adm-input"
					name="id"
					value={values.id ?? ''}
					readonly={mode === 'edit'}
					placeholder="auto from city"
				/>
			</FormField>
			<FormField label="Sort order" help="Lower appears first.">
				<input
					class="adm-input"
					type="number"
					name="sortOrder"
					value={values.sortOrder ?? 0}
				/>
			</FormField>
		</FormSection>
	{/snippet}
</FormShell>
