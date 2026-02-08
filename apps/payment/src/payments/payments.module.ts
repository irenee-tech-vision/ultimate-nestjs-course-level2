import { Module } from '@nestjs/common';
import { STRIPE_CLIENT_TOKEN } from './constant';
import { AppConfigService } from '../app-config/app-config.service';
import { AppConfigModule } from '../app-config/app-config.module';
import { PaymentsService } from './payments.service';
import Stripe from 'stripe';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';

@Module({
  imports: [AppConfigModule, OrdersModule, TypeOrmModule.forFeature([Payment])],
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
  controllers: [PaymentsController],
})
export class PaymentsModule {}
