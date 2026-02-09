import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { STRIPE_CLIENT_TOKEN } from './constant';
import Stripe from 'stripe';
import { AppConfigService } from '../app-config/app-config.service';
import { OrdersService } from '../orders/orders.service';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(STRIPE_CLIENT_TOKEN)
    private readonly stripeClient: Stripe,
    private readonly appConfigService: AppConfigService,
    private readonly orderService: OrdersService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async onModuleInit() {
    await this.stripeClient.customers.list({ limit: 1 });
    this.logger.log('Stripe client initialized');
  }

  async createPaymentIntent(orderId: string) {
    const order = await this.orderService.findOne(orderId);

    const payment = this.paymentRepository.create({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
    await this.paymentRepository.save(payment);

    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount: order.amount,
      currency: order.currency,
      metadata: {
        payment: payment.id,
        orderId,
      },
      payment_method_types: ['card'],
    });

    payment.stripePaymentIntentId = paymentIntent.id;
    await this.paymentRepository.save(payment);

    this.logger.debug(`Payment intent created for order ${orderId}`, {
      paymentIntentIt: paymentIntent.id,
      paymentId: payment.id,
      orderId,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    };
  }

  async createCheckoutSession(orderId: string) {
    const order = await this.orderService.findOne(orderId);
    const appUrl = this.appConfigService.appUrl;

    const payment = this.paymentRepository.create({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
    await this.paymentRepository.save(payment);

    const session = await this.stripeClient.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: order.currency,
            product_data: {
              name: order.description ?? 'Order',
            },
            unit_amount: order.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel.html`,
      payment_intent_data: {
        metadata: { paymentId: payment.id, orderId },
      },
    });

    this.logger.log(
      `Checkout session ${session.id} created for order ${orderId}`,
    );

    payment.stripeCheckoutSessionId = session.id;
    await this.paymentRepository.save(payment);

    return {
      url: session.url,
    };
  }

  async markSucceeded(
    paymentId: string,
    stripePaymentIntentId: string,
  ): Promise<void> {
    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.SUCCEEDED,
      stripePaymentIntentId,
    });
    this.logger.log(`Payment ${paymentId} marked as succeeded`);
  }

  async markFailed(
    paymentId: string,
    stripePaymentIntentId: string,
  ): Promise<void> {
    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.FAILED,
      stripePaymentIntentId,
    });
    this.logger.log(`Payment ${paymentId} marked as failed`);
  }
}
