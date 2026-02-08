import { IsNotEmpty, IsString } from 'class-validator';

export class PaymentCheckoutDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}