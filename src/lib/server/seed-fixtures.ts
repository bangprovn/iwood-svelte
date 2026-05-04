// Static fixtures used only by the dev seed script. Lives under `lib/server`
// so it's never bundled into client code.

import { IMG } from '$lib/data/iwood';

export type CategoryFixture = {
	id: string;
	vi: string;
	en: string;
	count: number;
	img: string;
	blurb: string;
	priceFrom: number;
};

export type ProductFixture = {
	id: string;
	code: string;
	vi: string;
	en: string;
	cat: string;
	price: number;
	img: string;
	specs: string[];
	tag?: string;
	desc: string;
};

export type ProjectFixture = {
	id: string;
	vi: string;
	en: string;
	cat: string;
	year: number;
	area: string;
	loc: string;
	img: string;
	products: string[];
	summary: string;
};

export type ProjectCategoryFixture = {
	id: string;
	vi: string;
	en: string;
	count: number;
};

export type PostFixture = {
	id: string;
	vi: string;
	en: string;
	cat: string;
	date: string;
	img: string;
	excerpt: string;
};

export const categories: CategoryFixture[] = [
	{ id: 'than-tre', vi: 'Tấm ốp than tre', en: 'Bamboo Charcoal Panels', count: 24, img: IMG.cat1, blurb: 'Eco-friendly, fire-retardant, moisture-proof flagship line.', priceFrom: 180000 },
	{ id: 'pvc-nano', vi: 'Tấm ốp PVC Nano', en: 'PVC Nano Panels', count: 18, img: IMG.cat2, blurb: 'Composite cladding with fine wood textures.', priceFrom: 195000 },
	{ id: 'spc', vi: 'Tấm ốp SPC đá', en: 'SPC Stone Panels', count: 14, img: IMG.cat3, blurb: 'Stone-plastic composite — premium stone-look surfaces.', priceFrom: 240000 },
	{ id: 'lam-song', vi: 'Lam sóng — Lam hộp', en: 'Fluted & Box Slats', count: 22, img: IMG.cat4, blurb: 'Vertical wall slats — rhythm + acoustic depth.', priceFrom: 210000 },
	{ id: 'gia-da', vi: 'Tấm ốp giả đá', en: 'Stone-look Panels', count: 16, img: IMG.cat5, blurb: 'Marble, concrete and travertine surfaces.', priceFrom: 220000 },
	{ id: 'phu-kien', vi: 'Phụ kiện', en: 'Accessories', count: 31, img: IMG.cat6, blurb: 'Trim, edging, adhesive, profiles.', priceFrom: 35000 }
];

export const products: ProductFixture[] = [
	{ id: 'pet-is9', code: 'PET iS-9', vi: 'Tấm ốp than tre iWood iS-9', en: 'iWood Bamboo Charcoal Panel iS-9', cat: 'than-tre', price: 220000, img: IMG.prod1, specs: ['9mm', '300×2900', 'V-groove'], tag: 'BEST SELLER', desc: 'Bề mặt phim PET kháng xước, vân gỗ tự nhiên. Lõi tre than nén đặc — chống ẩm tuyệt đối.' },
	{ id: 'pet-is6', code: 'PET iS-6', vi: 'Tấm ốp than tre iWood iS-6', en: 'iWood Bamboo Charcoal Panel iS-6', cat: 'than-tre', price: 195000, img: IMG.prod2, specs: ['6mm', '300×2900', 'Flat'], desc: 'Phiên bản mỏng, phù hợp ốp trần và vách ngăn nhẹ.' },
	{ id: 'pet-is12', code: 'PET iS-12', vi: 'Tấm ốp than tre dày iWood iS-12', en: 'iWood Premium iS-12', cat: 'than-tre', price: 295000, img: IMG.prod3, specs: ['12mm', '300×2900', '3D'], tag: 'NEW', desc: 'Vân 3D, độ sâu cao — dùng cho mặt tiền và sảnh khách sạn.' },
	{ id: 'pvc-n5', code: 'NANO N-5', vi: 'Tấm ốp PVC Nano N-5', en: 'PVC Nano N-5', cat: 'pvc-nano', price: 165000, img: IMG.prod4, specs: ['5mm', '400×2800', 'Flat'], desc: 'Bề mặt phủ Nano kháng khuẩn — phù hợp văn phòng và phòng họp.' },
	{ id: 'pvc-n8', code: 'NANO N-8', vi: 'Tấm ốp PVC Nano N-8 vân đá', en: 'PVC Nano N-8 Stone', cat: 'pvc-nano', price: 198000, img: IMG.prod5, specs: ['8mm', '600×2800', 'Stone'], desc: 'Vân đá cẩm thạch sắc nét, độ phân giải in HD.' },
	{ id: 'spc-5s20', code: 'SPC 5S20-F', vi: 'Tấm ốp SPC đá 5S20-F', en: 'SPC Stone 5S20-F', cat: 'spc', price: 285000, img: IMG.prod6, specs: ['4mm', '600×1200', 'Marble'], tag: 'PREMIUM', desc: 'Lõi SPC đặc — chống cháy lan, không cong vênh.' },
	{ id: 'spc-7s30', code: 'SPC 7S30-G', vi: 'Tấm ốp SPC granite 7S30', en: 'SPC Granite 7S30', cat: 'spc', price: 315000, img: IMG.prod7, specs: ['5mm', '600×1200', 'Granite'], desc: 'Vân granite tối thiểu — sảnh ngân hàng, văn phòng cao cấp.' },
	{ id: 'lam-l40', code: 'LAM L-40', vi: 'Lam sóng L-40 vân gỗ óc chó', en: 'Fluted L-40 Walnut', cat: 'lam-song', price: 245000, img: IMG.prod8, specs: ['Sóng 40mm', '170×2900', 'Walnut'], tag: 'BEST SELLER', desc: 'Sóng 40mm cổ điển — tạo nhịp điệu mạnh cho không gian.' },
	{ id: 'lam-l25', code: 'LAM L-25', vi: 'Lam sóng nhỏ L-25', en: 'Fine Fluted L-25', cat: 'lam-song', price: 215000, img: IMG.prod9, specs: ['Sóng 25mm', '125×2900', 'Oak'], desc: 'Sóng nhỏ — tinh tế cho phòng ngủ và phòng làm việc.' },
	{ id: 'gd-m4', code: 'STONE M-4', vi: 'Tấm giả đá cẩm thạch M-4', en: 'Marble-look M-4', cat: 'gia-da', price: 268000, img: IMG.prod10, specs: ['8mm', '600×2440', 'Carrara'], desc: 'Carrara cổ điển — phòng tắm và bếp.' },
	{ id: 'gd-c2', code: 'CONCRETE C-2', vi: 'Tấm giả bê tông C-2', en: 'Concrete-look C-2', cat: 'gia-da', price: 225000, img: IMG.prod11, specs: ['8mm', '600×2440', 'Industrial'], desc: 'Vân bê tông thô — phong cách industrial.' },
	{ id: 'pk-trim', code: 'TRIM T-90', vi: 'Phào nẹp kết thúc T-90', en: 'End trim T-90', cat: 'phu-kien', price: 45000, img: IMG.prod12, specs: ['2.9m', 'Aluminum'], desc: 'Phào nhôm anodized — kết thúc cạnh hoàn hảo.' }
];

export const projects: ProjectFixture[] = [
	{ id: 'vcb-tower', vi: 'Tháp Vietcombank Hà Nội', en: 'Vietcombank Tower Hanoi', cat: 'commercial', year: 2024, area: '4,200 m²', loc: 'Hà Nội', img: IMG.proj1, products: ['SPC 5S20-F', 'LAM L-40'], summary: 'Sảnh giao dịch và 12 tầng văn phòng — SPC đá granite + lam óc chó.' },
	{ id: 'capella-cafe', vi: 'Chuỗi Capella Coffee', en: 'Capella Coffee Chain', cat: 'cafe', year: 2024, area: '8 chi nhánh', loc: 'TP.HCM', img: IMG.proj2, products: ['PET iS-9', 'LAM L-25'], summary: 'Hệ thống 8 cửa hàng — than tre vân tự nhiên + lam sóng nhỏ.' },
	{ id: 'pullman-saigon', vi: 'Khách sạn Pullman Sài Gòn', en: 'Pullman Saigon Hotel', cat: 'hotel', year: 2023, area: '12,500 m²', loc: 'TP.HCM', img: IMG.proj3, products: ['PET iS-12', 'STONE M-4'], summary: '210 phòng + sảnh — than tre 3D + cẩm thạch Carrara.' },
	{ id: 'villa-thao-dien', vi: 'Biệt thự Thảo Điền', en: 'Thao Dien Villa', cat: 'residential', year: 2024, area: '850 m²', loc: 'TP.HCM', img: IMG.proj4, products: ['LAM L-40', 'PET iS-9'], summary: 'Biệt thự ven sông — phối lam óc chó với mặt than tre.' },
	{ id: 'aeon-mall', vi: 'AEON Mall Bình Tân', en: 'AEON Mall Binh Tan', cat: 'commercial', year: 2023, area: '6,800 m²', loc: 'TP.HCM', img: IMG.proj5, products: ['NANO N-8'], summary: 'Khu food court và hành lang — nano vân đá HD.' },
	{ id: 'metropole-hanoi', vi: 'Sofitel Metropole Hà Nội', en: 'Sofitel Metropole Hanoi', cat: 'hotel', year: 2024, area: '3,400 m²', loc: 'Hà Nội', img: IMG.proj6, products: ['LAM L-25', 'PET iS-12'], summary: 'Cải tạo cánh Heritage — bảo tồn cổ điển + công nghệ mới.' },
	{ id: 'starlight-cafe', vi: 'Starlight Cafe District 1', en: 'Starlight Cafe D1', cat: 'cafe', year: 2024, area: '320 m²', loc: 'TP.HCM', img: IMG.proj7, products: ['LAM L-40'], summary: 'Quán cafe rooftop — lam óc chó full chiều cao.' },
	{ id: 'vinhomes-grand', vi: 'Vinhomes Grand Park', en: 'Vinhomes Grand Park', cat: 'residential', year: 2024, area: '14 căn mẫu', loc: 'TP.HCM', img: IMG.proj8, products: ['PET iS-9', 'STONE M-4'], summary: 'Căn hộ mẫu — bộ thi công trọn gói cho chủ đầu tư.' },
	{ id: 'sun-world', vi: 'Sun World Hạ Long', en: 'Sun World Ha Long', cat: 'commercial', year: 2023, area: '5,600 m²', loc: 'Quảng Ninh', img: IMG.proj9, products: ['CONCRETE C-2', 'LAM L-40'], summary: 'Khu vui chơi — bê tông thô + lam gỗ tạo tương phản.' }
];

export const projectCategories: ProjectCategoryFixture[] = [
	{ id: 'all', vi: 'Tất cả', en: 'All', count: projects.length },
	{ id: 'commercial', vi: 'Thương mại', en: 'Commercial', count: projects.filter((p) => p.cat === 'commercial').length },
	{ id: 'hotel', vi: 'Khách sạn', en: 'Hotels', count: projects.filter((p) => p.cat === 'hotel').length },
	{ id: 'cafe', vi: 'Cafe & F&B', en: 'Cafe & F&B', count: projects.filter((p) => p.cat === 'cafe').length },
	{ id: 'residential', vi: 'Nhà ở', en: 'Residential', count: projects.filter((p) => p.cat === 'residential').length }
];

export const posts: PostFixture[] = [
	{ id: 'p1', vi: '5 lý do nên chọn tấm ốp than tre cho ngôi nhà 2026', en: 'Why bamboo charcoal is the cladding of 2026', cat: 'Kiến thức', date: '12.04.2026', img: IMG.blog1, excerpt: 'Vật liệu sinh thái thay thế gỗ tự nhiên — bền hơn, thân thiện môi trường, giá hợp lý.' },
	{ id: 'p2', vi: 'Hướng dẫn thi công lam sóng cho tường cao 6m', en: 'Installing 6m fluted slat walls', cat: 'Hướng dẫn', date: '04.04.2026', img: IMG.blog2, excerpt: 'Quy trình từ chuẩn bị bề mặt đến hoàn thiện điểm kết thúc — cho thợ và chủ nhà.' },
	{ id: 'p3', vi: 'iWood ra mắt dòng SPC đá thế hệ mới', en: 'iWood launches next-gen SPC stone', cat: 'Tin tức', date: '28.03.2026', img: IMG.blog3, excerpt: 'Bộ sưu tập 12 vân đá mới — từ Carrara cổ điển đến granite châu Phi.' },
	{ id: 'p4', vi: 'Phối màu trong thiết kế tường vách hiện đại', en: 'Color theory for modern wall design', cat: 'Cảm hứng', date: '20.03.2026', img: IMG.blog4, excerpt: 'Cách phối tone gỗ ấm với vật liệu tối — bài học từ 50 dự án.' },
	{ id: 'p5', vi: 'So sánh PVC Nano và SPC: chọn loại nào?', en: 'PVC Nano vs SPC: which to choose?', cat: 'Kiến thức', date: '12.03.2026', img: IMG.blog5, excerpt: 'Phân tích chi tiết về độ bền, giá thành và ứng dụng phù hợp.' },
	{ id: 'p6', vi: 'Showroom mới iWood Quận 7 đã mở cửa', en: 'New iWood D7 showroom opens', cat: 'Tin tức', date: '01.03.2026', img: IMG.blog6, excerpt: 'Trải nghiệm 200+ mẫu vật liệu trên 480m² — quận 7, TP.HCM.' }
];
