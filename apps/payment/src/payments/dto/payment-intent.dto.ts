import { IsNotEmpty, IsString } from 'class-validator';

export class PaymentIntentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}
