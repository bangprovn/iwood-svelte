/**
 * Admin-only CMS surface. Every function assumes the caller has already
 * passed `requireAdmin`. Re-exports the admin write surface plus the
 * admin-only page-builder and menu repos.
 */
export * from './admin-repos';
export * from './page.repo';
export * from './menu.repo';
