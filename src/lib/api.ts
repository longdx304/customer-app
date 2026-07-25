import { clearToken, getToken } from './tokenStorage';

// Configure per environment via app `.env` (EXPO_PUBLIC_API_URL).
const BASE_URL =
	process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:9000';

export class ApiError extends Error {
	status: number;
	code?: string;
	constructor(status: number, message: string, code?: string) {
		super(message);
		this.status = status;
		this.code = code;
	}
}

// Lets the AuthProvider react to a 401 (token expired / account disabled)
// from anywhere without a circular import.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
	onUnauthorized = fn;
}

type RequestOptions = {
	method?: string;
	body?: unknown;
	auth?: boolean;
	query?: Record<string, string | number | undefined>;
};

function buildQuery(query?: RequestOptions['query']): string {
	if (!query) return '';
	const parts = Object.entries(query)
		.filter(([, v]) => v !== undefined && v !== '')
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
	return parts.length ? `?${parts.join('&')}` : '';
}

async function request<T = any>(
	path: string,
	opts: RequestOptions = {}
): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (opts.auth !== false) {
		const token = await getToken();
		if (token) headers['Authorization'] = `Bearer ${token}`;
	}

	const res = await fetch(`${BASE_URL}${path}${buildQuery(opts.query)}`, {
		method: opts.method ?? 'GET',
		headers,
		body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
	});

	const data = await res.json().catch(() => null);

	if (res.status === 401) {
		await clearToken();
		onUnauthorized?.();
		throw new ApiError(401, data?.message ?? 'Unauthorized', data?.code);
	}

	if (!res.ok) {
		throw new ApiError(
			res.status,
			data?.message ?? 'Đã có lỗi xảy ra',
			data?.code
		);
	}

	return data as T;
}

export type AuthCustomer = {
	id: string;
	first_name?: string;
	last_name?: string;
	phone?: string;
	customer_code?: string | null;
};

export type ProductListItem = {
	id: string;
	title: string;
	thumbnail: string | null;
	total_quantity: number;
};

export type ProductVariantRow = {
	id: string;
	sku: string | null;
	title: string | null;
	total_quantity: number;
	unit: string | null;
};

export type ProductDetail = {
	id: string;
	title: string;
	thumbnail: string | null;
	description: string | null;
	total_quantity: number;
	variants: ProductVariantRow[];
};

export const api = {
	login: (phone: string, password: string) =>
		request<{ access_token: string; customer: AuthCustomer }>(
			'/store/customer-inventory/auth/token',
			{ method: 'POST', body: { phone, password }, auth: false }
		),
	me: () => request<{ customer: AuthCustomer }>(
		'/store/customer-inventory/auth/me'
	),
	products: (params: { q?: string; limit?: number; offset?: number }) =>
		request<{
			products: ProductListItem[];
			count: number;
			offset: number;
			limit: number;
		}>('/store/customer-inventory/products', { query: params }),
	product: (id: string) =>
		request<{ product: ProductDetail }>(
			`/store/customer-inventory/products/${id}`
		),
};
