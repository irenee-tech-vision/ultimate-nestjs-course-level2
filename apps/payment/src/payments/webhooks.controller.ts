import {
  BadRequestException,
  Controller,
  Headers,
  Inject,
  Logger,
  Post,
  RawBody,
} from '@nestjs/common';
import { AppConfigService } from '../app-config/app-config.service';
import { STRIPE_CLIENT_TOKEN } from './constant';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { InjectRepository } from '@nestjs/typeorm';
import { StripeEvent } from './entities/stripe.entity';
import { Repository } from 'typeorm';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    @Inject(STRIPE_CLIENT_TOKEN)
    private readonly stripeClient: Stripe,
    private readonly appConfigService: AppConfigService,
    private readonly paymentService: PaymentsService,
    @InjectRepository(StripeEvent)
    private readonly stripeEventRepository: Repository<StripeEvent>,
  ) {}

  @Post('stripe')
  async handleStripeEvent(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
  ) {
    this.logger.debug('stripe event received');
    let event;

    try {
      event = this.stripeClient.webhooks.constructEvent(
        rawBody,
        signature,
        this.appConfigService.stripeWebhookSecret,
      );
    } catch (error) {
      this.logger.error(
        `Webhook signature verification failed: ${error.message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Event of type ${event.type}`);

    const existingEvent = await this.stripeEventRepository.findOne({
      where: { id: event.id },
    });

    if (existingEvent) {
      this.logger.log(`Event ${event.id} already processed`);
      return;
    }

    await this.stripeEventRepository.save({ id: event.id });

    switch (event.type) {
      case 'payment_intent.succeeded':
        this.logger.log(`Handling: ${event.type}`);
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        this.logger.log(`Handling: ${event.type}`);
        await this.handlePaymentIntentFailed(event.data.object);
        break;
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const paymentId = paymentIntent.metadata.paymentId;
    if (!paymentId) {
      this.logger.warn('No paymentId in metadata');
      return;
    }

    await this.paymentService.markSucceeded(paymentId, paymentIntent.id);
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const paymentId = paymentIntent.metadata.paymentId;
    if (!paymentId) {
      this.logger.warn('No paymentId in metadata');
      return;
    }

    await this.paymentService.markFailed(paymentId, paymentIntent.id);
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    // For checkout sessions, payment_intent.succeeded also fires
    // This handler is for checkout-specific logic if needed
    this.logger.log(`Checkout session completed: ${session.id}`);
  }
}
