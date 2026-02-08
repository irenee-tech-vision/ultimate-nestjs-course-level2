import { Body, Controller, Logger, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentCheckoutDto } from './dto/payment-checkout.dto';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  createCheckoutSession(@Body() checkoutDto: PaymentCheckoutDto){
    this.logger.debug(
      `Creating checkout session for order ${checkoutDto.orderId}`,
    );

    return this.paymentsService.createCheckoutSession(checkoutDto.orderId)
  }
}
