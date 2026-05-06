<script lang="ts">
	import { enhance } from '$app/forms';
	import { useI18n, t } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const i18n = useI18n();
</script>

<section class="auth-wrap">
	<div class="auth-card">
		<span class="wedge"></span>
		<h1>{t($i18n, 'auth.register.title')}</h1>
		<p class="sub">{t($i18n, 'auth.register.sub')}</p>

		{#if form?.message}<p class="err">{form.message}</p>{/if}

		<form method="post" action="?/signUp" use:enhance class="form">
			<input type="hidden" name="next" value={data.next} />
			<label>
				<span>{t($i18n, 'auth.name')}</span>
				<input
					type="text"
					name="name"
					autocomplete="name"
					required
					value={form?.name ?? ''}
				/>
			</label>
			<label>
				<span>{t($i18n, 'auth.email')}</span>
				<input
					type="email"
					name="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
				/>
			</label>
			<label>
				<span>{t($i18n, 'auth.password')}</span>
				<input
					type="password"
					name="password"
					autocomplete="new-password"
					minlength="8"
					required
				/>
			</label>
			<label>
				<span>{t($i18n, 'auth.confirm_password')}</span>
				<input
					type="password"
					name="confirm"
					autocomplete="new-password"
					minlength="8"
					required
				/>
			</label>
			<button type="submit">{t($i18n, 'auth.register')}</button>
		</form>

		<p class="alt">
			{t($i18n, 'auth.register.have_account')}
			<a href="/login?next={encodeURIComponent(data.next)}">{t($i18n, 'auth.sign_in')}</a>
		</p>
	</div>
</section>

<style>
	.auth-wrap {
		min-height: calc(100vh - 200px);
		display: grid;
		place-items: center;
		padding: 48px 16px;
		background: var(--bone, #f6f4f0);
	}
	.auth-card {
		position: relative;
		width: 100%;
		max-width: 460px;
		background: var(--paper);
		border: 1px solid var(--hairline, #e5e2dc);
		border-radius: 8px;
		padding: 32px;
		box-shadow: var(--shadow-2, 0 4px 12px rgba(15, 15, 16, 0.06));
	}
	.wedge {
		display: block;
		width: 40px;
		height: 3px;
		background: var(--tw-red);
		margin-bottom: 16px;
	}
	h1 {
		margin: 0 0 8px;
		font-size: 24px;
		font-weight: 800;
		letter-spacing: 0.01em;
		color: var(--ink);
	}
	.sub {
		color: var(--fg-3, #6b6b70);
		font-size: 14px;
		margin: 0 0 22px;
	}
	.err {
		background: rgba(227, 6, 19, 0.08);
		color: #b50510;
		border-left: 3px solid var(--tw-red);
		padding: 10px 14px;
		font-size: 13px;
		font-weight: 500;
		margin: 0 0 16px;
		border-radius: 4px;
	}
	.form {
		display: grid;
		gap: 14px;
	}
	.form label {
		display: grid;
		gap: 6px;
	}
	.form span {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--fg-2, #3a3a3d);
	}
	.form input {
		padding: 10px 12px;
		border: 1.5px solid var(--hairline, #e5e2dc);
		border-radius: 6px;
		font: inherit;
		font-size: 14px;
		color: var(--ink);
		background: var(--paper);
	}
	.form input:focus {
		outline: none;
		border-color: var(--tw-red);
		box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.14);
	}
	button {
		margin-top: 4px;
		background: var(--tw-red);
		color: var(--paper);
		border: 1.5px solid var(--tw-red);
		padding: 11px 18px;
		font-weight: 700;
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border-radius: 6px;
		cursor: pointer;
		transition:
			background 150ms ease,
			transform 100ms ease;
	}
	button:hover {
		background: var(--tw-red-deep);
		border-color: var(--tw-red-deep);
	}
	button:active {
		transform: translateY(1px);
	}
	.alt {
		margin: 18px 0 0;
		font-size: 13px;
		color: var(--fg-3, #6b6b70);
		text-align: center;
	}
	.alt a {
		color: var(--tw-red);
		font-weight: 700;
		text-decoration: none;
	}
	.alt a:hover {
		text-decoration: underline;
	}
</style>
