// Decorative image references and the price formatter — the only client-side
// constants that survived the move from static fixtures to the DB. The catalog,
// project, and post data now live in the database (see `lib/server/repos.ts`)
// and are seeded from `lib/server/seed-fixtures.ts`.

export const IMG = {
	heroBambooWall: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=1600&q=80&auto=format&fit=crop',
	heroLobby: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80&auto=format&fit=crop',
	heroCafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=80&auto=format&fit=crop',
	heroHotel: 'https://images.unsplash.com/photo-1564540583246-934409427776?w=1600&q=80&auto=format&fit=crop',

	cat1: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=80&auto=format&fit=crop',
	cat2: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200&q=80&auto=format&fit=crop',
	cat3: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=1200&q=80&auto=format&fit=crop',
	cat4: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200&q=80&auto=format&fit=crop',
	cat5: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
	cat6: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80&auto=format&fit=crop',

	prod1: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=900&q=80&auto=format&fit=crop',
	prod2: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=900&q=80&auto=format&fit=crop',
	prod3: 'https://images.unsplash.com/photo-1616593871468-2cc36b7e0d56?w=900&q=80&auto=format&fit=crop',
	prod4: 'https://images.unsplash.com/photo-1618219740975-d40978bb7378?w=900&q=80&auto=format&fit=crop',
	prod5: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=900&q=80&auto=format&fit=crop',
	prod6: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80&auto=format&fit=crop',
	prod7: 'https://images.unsplash.com/photo-1617104551722-3b2d51366400?w=900&q=80&auto=format&fit=crop',
	prod8: 'https://images.unsplash.com/photo-1618221710144-4f9f97f5d4f5?w=900&q=80&auto=format&fit=crop',
	prod9: 'https://images.unsplash.com/photo-1616627451515-d68a3f4adfe7?w=900&q=80&auto=format&fit=crop',
	prod10: 'https://images.unsplash.com/photo-1615875221137-e6dca56a3b56?w=900&q=80&auto=format&fit=crop',
	prod11: 'https://images.unsplash.com/photo-1561049501-e1f96bdd98fd?w=900&q=80&auto=format&fit=crop',
	prod12: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=900&q=80&auto=format&fit=crop',

	proj1: 'https://images.unsplash.com/photo-1631049552240-59fa6f8a9180?w=1400&q=80&auto=format&fit=crop',
	proj2: 'https://images.unsplash.com/photo-1564540583246-934409427776?w=1400&q=80&auto=format&fit=crop',
	proj3: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1400&q=80&auto=format&fit=crop',
	proj4: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1400&q=80&auto=format&fit=crop',
	proj5: 'https://images.unsplash.com/photo-1618221381711-42ca8ab6e908?w=1400&q=80&auto=format&fit=crop',
	proj6: 'https://images.unsplash.com/photo-1559599238-308793637427?w=1400&q=80&auto=format&fit=crop',
	proj7: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1400&q=80&auto=format&fit=crop',
	proj8: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1400&q=80&auto=format&fit=crop',
	proj9: 'https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?w=1400&q=80&auto=format&fit=crop',

	factory: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1600&q=80&auto=format&fit=crop',
	team: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80&auto=format&fit=crop',
	install: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&q=80&auto=format&fit=crop',

	blog1: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=80&auto=format&fit=crop',
	blog2: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80&auto=format&fit=crop',
	blog3: 'https://images.unsplash.com/photo-1556909114-44e3e9399a2e?w=900&q=80&auto=format&fit=crop',
	blog4: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=900&q=80&auto=format&fit=crop',
	blog5: 'https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?w=900&q=80&auto=format&fit=crop',
	blog6: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=900&q=80&auto=format&fit=crop'
} as const;

export const fmt = (n: number) => n.toLocaleString('vi-VN');
