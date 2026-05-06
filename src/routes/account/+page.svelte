<script lang="ts">
	import { enhance } from '$app/forms';
	import { useI18n, t } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const i18n = useI18n();

	const profileMsg = $derived(form?.scope === 'profile' ? form : null);
	const passwordMsg = $derived(form?.scope === 'password' ? form : null);
</script>

<section class="acct-wrap">
	<div class="acct-shell">
		<header class="acct-head">
			<span class="wedge"></span>
			<h1>{t($i18n, 'auth.account.title')}</h1>
			<p class="sub">{t($i18n, 'auth.account.sub')}</p>
		</header>

		<div class="acct-grid">
			<article class="card">
				<h2>{t($i18n, 'auth.account.profile')}</h2>
				{#if profileMsg?.success}
					<p class="ok">{t($i18n, 'auth.account.profile_updated')}</p>
				{:else if profileMsg?.message}
					<p class="err">{profileMsg.message}</p>
				{/if}
				<form method="post" action="?/updateProfile" use:enhance class="form">
					<label>
						<span>{t($i18n, 'auth.email')}</span>
						<input type="email" value={data.user.email} disabled />
					</label>
					<label>
						<span>{t($i18n, 'auth.name')}</span>
						<input type="text" name="name" required value={data.user.name ?? ''} />
					</label>
					<button type="submit">{t($i18n, 'auth.account.save')}</button>
				</form>
			</article>

			<article class="card">
				<h2>{t($i18n, 'auth.account.change_password')}</h2>
				{#if passwordMsg?.success}
					<p class="ok">{t($i18n, 'auth.account.password_updated')}</p>
				{:else if passwordMsg?.message}
					<p class="err">{passwordMsg.message}</p>
				{/if}
				<form method="post" action="?/changePassword" use:enhance class="form">
					<label>
						<span>{t($i18n, 'auth.account.current_password')}</span>
						<input
							type="password"
							name="currentPassword"
							autocomplete="current-password"
							required
						/>
					</label>
					<label>
						<span>{t($i18n, 'auth.account.new_password')}</span>
						<input
							type="password"
							name="newPassword"
							autocomplete="new-password"
							minlength="8"
							required
						/>
					</label>
					<button type="submit">{t($i18n, 'auth.account.save')}</button>
				</form>
			</article>
		</div>

		<form method="post" action="?/signOut" use:enhance class="signout-row">
			<button type="submit" class="signout">{t($i18n, 'auth.sign_out')}</button>
		</form>
	</div>
</section>

<style>
	.acct-wrap {
		min-height: calc(100vh - 200px);
		padding: 48px 16px;
		background: var(--bone, #f6f4f0);
	}
	.acct-shell {
		max-width: 920px;
		margin: 0 auto;
	}
	.acct-head {
		margin-bottom: 28px;
	}
	.wedge {
		display: inline-block;
		width: 40px;
		height: 3px;
		background: var(--tw-red);
		margin-bottom: 12px;
	}
	h1 {
		margin: 0 0 6px;
		font-size: 28px;
		font-weight: 800;
		color: var(--ink);
	}
	.sub {
		margin: 0;
		color: var(--fg-3, #6b6b70);
		font-size: 14px;
	}
	.acct-grid {
		display: grid;
		gap: 20px;
		grid-template-columns: 1fr 1fr;
	}
	@media (max-width: 720px) {
		.acct-grid {
			grid-template-columns: 1fr;
		}
	}
	.card {
		background: var(--paper);
		border: 1px solid var(--hairline, #e5e2dc);
		border-radius: 8px;
		padding: 24px;
		box-shadow: var(--shadow-2, 0 4px 12px rgba(15, 15, 16, 0.06));
	}
	.card h2 {
		margin: 0 0 16px;
		font-size: 16px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink);
	}
	.ok {
		background: rgba(20, 130, 60, 0.08);
		color: #14823c;
		border-left: 3px solid #14823c;
		padding: 8px 12px;
		font-size: 13px;
		margin: 0 0 14px;
		border-radius: 4px;
	}
	.err {
		background: rgba(227, 6, 19, 0.08);
		color: #b50510;
		border-left: 3px solid var(--tw-red);
		padding: 8px 12px;
		font-size: 13px;
		margin: 0 0 14px;
		border-radius: 4px;
	}
	.form {
		display: grid;
		gap: 12px;
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
	.form input:disabled {
		background: var(--bone, #f6f4f0);
		color: var(--fg-3, #6b6b70);
	}
	.form input:focus {
		outline: none;
		border-color: var(--tw-red);
		box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.14);
	}
	button {
		justify-self: start;
		background: var(--tw-red);
		color: var(--paper);
		border: 1.5px solid var(--tw-red);
		padding: 9px 16px;
		font-weight: 700;
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border-radius: 6px;
		cursor: pointer;
		transition: background 150ms ease;
	}
	button:hover {
		background: var(--tw-red-deep);
		border-color: var(--tw-red-deep);
	}
	.signout-row {
		margin-top: 28px;
		display: flex;
		justify-content: flex-end;
	}
	.signout {
		background: transparent;
		color: var(--fg-2, #3a3a3d);
		border: 1.5px solid var(--hairline, #e5e2dc);
	}
	.signout:hover {
		background: var(--ink);
		color: var(--paper);
		border-color: var(--ink);
	}
</style>
