import { IPaymentGateway } from "../Interfaces/paymentgateway";

export abstract class BaseTemplate implements IPaymentGateway {
  constructor() {}
  async processPayment(data: any): Promise<any> {
    await this.validate(data);
    const order = await this.initiate(data);
    return await this.confirm(order);
  }

  protected abstract validate(data: any): Promise<void>;
  protected abstract initiate(data: any): Promise<any>;
  protected abstract confirm(data: any): Promise<any>;
}
