PaymentController  (Singleton)
→ entry point for everything
→ handlePayment(GatewayType, PaymentRequest)
→ talks to PaymentService

PaymentService  (Singleton)
→ holds current gateway
→ setGateway() → assigns provider
→ processPayment() → delegates to gateway

PaymentRequest  (Data class)
→ sender, receiver, amount, currency
→ just carries data, no logic

GatewayFactory  (Singleton)
→ getGateway(GatewayType) → returns right gateway
→ wraps gateway in Proxy automatically

GatewayType  (Enum)
→ PAYTM, RAZORPAY

PaymentGateway  (Abstract)
→ BaseTemplate
→ validate → initiate → confirm

PaymentGatewayProxy
→ wraps real gateway
→ adds retry logic
→ same interface as PaymentGateway

PaytmGateway
→ extends PaymentGateway
→ uses PaytmBankingSystem

RazorpayGateway
→ extends PaymentGateway
→ uses RazorpayBankingSystem

BankingSystem  (Abstract)
→ processPayment(amount)

PaytmBankingSystem
→ 80% success simulation

RazorpayBankingSystem
→ 90% success simulation