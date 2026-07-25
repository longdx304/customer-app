export type InventoryStatusTone = 'high' | 'low' | 'out';

export type InventoryStatus = {
	label: string;
	tone: InventoryStatusTone;
};

export function getInventoryStatus(quantity: number): InventoryStatus {
	if (quantity <= 0) {
		return { label: 'Hết hàng', tone: 'out' };
	}

	if (quantity > 60) {
		return { label: '>60 đôi', tone: 'high' };
	}

	return { label: '<60 đôi', tone: 'low' };
}
