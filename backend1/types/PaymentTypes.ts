

export interface PaymentData {
    amount: number;
    currency: string;
    receipt: string;
}

export interface PaymentResponse {
    orderId: string;
    amount: number;
    currency: string;
    status: string;
}