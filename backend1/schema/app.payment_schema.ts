import * as z from "zod";

export const CreateOrderSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.enum(["INR", "USD"]).default("INR"), 
  customerName: z.string().min(2),
  metadata: z.union([z.record(z.string(), z.unknown()), z.string()]).optional(),
  idempotencyKey: z.string().min(1), 
  customoreEmail: z.string().optional(),
  Provider: z.string(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
