// PaymentModal.tsx
// This component is the embeddable payment widget
// Merchants import this into their own React apps
//
// Props needed (leave as TODO):
//   amount: number
//   currency: string
//   merchantPublicKey: string
//   onSuccess: (transactionId: string) => void
//   onFailure: (error: string) => void
//
// Flow (leave as TODO comments):
//   1. Call POST /api/v1/payments/order with sk_live key
//   2. Get razorpayOrderId back
//   3. Open Razorpay checkout with that orderId
//   4. On Razorpay success → call POST /api/v1/payments/verify
//   5. Call onSuccess or onFailure prop

const PaymentModal = () => {
  // TODO: implement
  return null
}

export default PaymentModal
