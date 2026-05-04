<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	const errMessage = $derived(
		form?.message ?? (data.error === 'forbidden' ? 'You are signed in but not an admin.' : null)
	);
</script>

<div class="login-wrap">
	<div class="login-card">
		<span class="red-wedge"></span>
		<span class="eyebrow">Admin console</span>
		<div class="brand"><span class="i">i</span>Wood</div>
		<p class="sub">Sign in to manage catalog &amp; content.</p>

		{#if errMessage}<p class="err">{errMessage}</p>{/if}

		<form method="post" action="?/signIn" use:enhance class="login-form">
			<input type="hidden" name="next" value={data.next} />
			<label>
				<span>Email</span>
				<input
					type="email"
					name="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
				/>
			</label>
			<label>
				<span>Password</span>
				<input type="password" name="password" autocomplete="current-password" required />
			</label>
			<button type="submit">Sign in</button>
		</form>
	</div>
</div>

<style>
	.login-wrap {
		min-height: 100vh;
		background:
			radial-gradient(ellipse at 20% 0%, rgba(227, 6, 19, 0.08), transparent 55%),
			var(--ink);
		color: var(--paper);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		font-family: var(--font-body);
	}
	.login-card {
		position: relative;
		width: 100%;
		max-width: 400px;
		background: var(--paper);
		color: var(--fg-1);
		border-radius: var(--radius-md);
		padding: 32px 32px 28px;
		box-shadow: var(--shadow-3);
	}
	.red-wedge {
		display: block;
		width: 48px;
		height: 4px;
		background: var(--accent);
		margin-bottom: 16px;
	}
	.eyebrow {
		display: block;
		font-family: var(--font-body);
		font-size: var(--fs-xs);
		font-weight: var(--fw-bold);
		letter-spacing: var(--tracking-caps);
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 6px;
	}
	.brand {
		font-family: var(--font-display);
		font-size: 36px;
		font-weight: var(--fw-black);
		line-height: 1;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		color: var(--ink);
	}
	.brand .i {
		color: var(--accent);
	}
	.sub {
		color: var(--fg-3);
		font-size: var(--fs-sm);
		margin: 8px 0 22px;
	}
	.err {
		background: var(--iwood-red-soft);
		color: var(--accent-hover);
		padding: 10px 14px;
		border-left: 3px solid var(--accent);
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
		margin: 0 0 14px;
	}
	.login-form {
		display: grid;
		gap: 14px;
	}
	.login-form label {
		display: grid;
		gap: 6px;
	}
	.login-form span {
		font-size: var(--fs-xs);
		font-weight: var(--fw-bold);
		letter-spacing: var(--tracking-caps);
		text-transform: uppercase;
		color: var(--fg-2);
	}
	.login-form input {
		padding: 10px 12px;
		border: 1.5px solid var(--border);
		border-radius: var(--radius-sm);
		font: inherit;
		font-size: var(--fs-sm);
		color: var(--fg-1);
		transition:
			border-color var(--dur-base) var(--ease-out),
			box-shadow var(--dur-base) var(--ease-out);
	}
	.login-form input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.14);
	}
	button {
		margin-top: 8px;
		background: var(--accent);
		color: var(--paper);
		border: 1.5px solid var(--accent);
		padding: 11px 18px;
		font-family: var(--font-body);
		font-weight: var(--fw-bold);
		font-size: var(--fs-xs);
		letter-spacing: var(--tracking-caps);
		text-transform: uppercase;
		border-radius: var(--radius-sm);
		cursor: pointer;
		box-shadow: var(--shadow-red);
		transition:
			background var(--dur-base) var(--ease-out),
			border-color var(--dur-base) var(--ease-out),
			transform var(--dur-fast) var(--ease-out);
	}
	button:hover {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
		transform: translateY(-1px);
	}
	button:active {
		transform: translateY(1px);
	}
</style>
