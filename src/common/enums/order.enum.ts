export enum OrderStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	SHIPPED = 'shipped',
	DELIVERED = 'delivered',
	CANCELLED = 'cancelled',
}

export enum PaymentMethod {
	CASH = 'cash',
	CARD = 'card',
}

export enum PaymentStatus {
	PENDING = 'pending',
	PAID = 'paid',
	FAILED = 'failed',
	REFUNDED = 'refunded',
}
