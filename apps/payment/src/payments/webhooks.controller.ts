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

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    @Inject(STRIPE_CLIENT_TOKEN)
    private readonly stripeClient: Stripe,
    private readonly appConfigService: AppConfigService,
  ) {}

  @Post('stripe')
  handleStripeEvent(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
  ) {
    this.logger.debug('stripe event received');

    try {
      this.stripeClient.webhooks.constructEvent(
        rawBody,
        signature,
        this.appConfigService.stripeWebhookSecret
      )

    } catch (error) {
      this.logger.error(
        `Webhook signature verification failed: ${error.message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}
