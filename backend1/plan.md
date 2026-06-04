W5   Redis pub/sub        →  Observer pattern
     After: wrap publisher in EventEmitter class
     
     Before:
       await redisPublisher.publish("payment.success", data)
     
     After:
       class PaymentEventEmitter {
         async emit(event: string, data: object) {
           await redisPublisher.publish(event, JSON.stringify(data))
         }
       }

W6   BullMQ + Workers     →  Template Method
     After: BaseProcessor class enforces step order
     
     abstract class BaseProcessor {
       async process() {
         await this.validate()    // step 1 — enforced
         await this.initiate()    // step 2 — enforced
         await this.confirm()     // step 3 — enforced
       }
       abstract validate(): Promise<void>
       abstract initiate(): Promise<void>
       abstract confirm(): Promise<void>
     }
     
     class RazorpayProcessor extends BaseProcessor {
       async validate() { ... }
       async initiate() { ... }
       async confirm()  { ... }
     }

W7   Analytics            →  Repository pattern
     After: wrap all DB queries in a class
     
     Before:
       Transaction.find({ appId, status: "paid" })
     
     After:
       class TransactionRepository {
         findPaid(appId: string) {
           return Transaction.find({ appId, status: "paid" })
         }
         dailyVolume(appId: string) {
           return Transaction.aggregate([...])
         }
       }

W8   Rate limit + cluster →  Proxy pattern
     After: wrap controller in proxy class
     
     class RateLimitProxy {
       constructor(private controller: PaymentController) {}
       
       async createOrder(req: Request, res: Response) {
         const allowed = await this.checkLimit(req.app._id)
         if (!allowed) return res.status(429).json({...})
         return this.controller.createOrder(req, res)
       }
     }

W9   Docker               →  Singleton audit
     After: ensure all clients are class singletons
     
     class RedisClient {
       private static instance: RedisClient
       
       static getInstance() {
         if (!this.instance) this.instance = new RedisClient()
         return this.instance
       }
     }

W10  Deploy + test        →  Facade pattern
     After: hide complexity behind one class
     
     Before — controller does everything:
       validate → idempotency → razorpay → save → ledger
     
     After — controller calls one line:
       class PaymentFacade {
         async pay(data: CreateOrderInput, appId: string) {
           // all logic hidden here
         }
       }
       
       // controller becomes:
       const result = await PaymentFacade.pay(data, appId)
       return res.status(201).json(result)

W11  Refactor             →  Factory + Strategy
     After: swap providers without touching anything
     
     interface PaymentStrategy {
       createOrder(amount: number): Promise<any>
       verifyPayment(data: any): Promise<boolean>
     }
     
     class RazorpayStrategy implements PaymentStrategy {
       async createOrder(amount: number) { ... }
       async verifyPayment(data: any)    { ... }
     }
     
     class GatewayFactory {
       static create(provider: string): PaymentStrategy {
         if (provider === "razorpay") return new RazorpayStrategy()
         if (provider === "stripe")   return new StripeStrategy()
         throw new Error("Unknown provider")
       }
     }
     
     // PaymentFacade now uses factory
     class PaymentFacade {
       async pay(data: CreateOrderInput, appId: string) {
         const gateway = GatewayFactory.create(
           process.env.PAYMENT_PROVIDER!
         )
         return gateway.createOrder(data.amount)
       }
     }

W12  Mock interviews      →  System design weekly
     After: explain every class, every pattern, every why
     Draw the class diagram on whiteboard
     Explain what problem each pattern solves




