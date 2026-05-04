<script lang="ts">
	import { useI18n, t } from '$lib/i18n';

	const i18n = useI18n();
</script>

<h1>{t($i18n, 'hello_world', { name: 'SvelteKit User' })}</h1>

<form method="POST" action="?/setLocale">
	{#each $i18n.locales as locale (locale.code)}
		<button name="locale" value={locale.code}>{locale.code}</button>
	{/each}
</form>

<p>
	Translations and locales are now managed in the admin console at
	<a href="/admin/translations">/admin/translations</a>
	and
	<a href="/admin/locales">/admin/locales</a>.
</p>
