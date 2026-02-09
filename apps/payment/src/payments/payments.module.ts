import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { AppConfigModule } from '../app-config/app-config.module';
import { AppConfigService } from '../app-config/app-config.service';
import { OrdersModule } from '../orders/orders.module';
import { STRIPE_CLIENT_TOKEN } from './constant';
import { Payment } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksController } from './webhooks.controller';
import { StripeEvent } from './entities/stripe.entity';

@Module({
  imports: [
    AppConfigModule,
    OrdersModule,
    TypeOrmModule.forFeature([Payment, StripeEvent]),
  ],
  providers: [
    {
      provide: STRIPE_CLIENT_TOKEN,
      useFactory: (appConfigService: AppConfigService) => {
        return new Stripe(appConfigService.stripeSecretKey);
      },
      inject: [AppConfigService],
    },
    PaymentsService,
  ],
  controllers: [PaymentsController, WebhooksController],
})
export class PaymentsModule {}
