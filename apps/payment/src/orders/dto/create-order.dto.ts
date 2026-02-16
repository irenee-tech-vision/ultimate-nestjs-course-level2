import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @Length(3, 3)
  @IsOptional()
  currency?: string = 'usd';

  @IsString()
  @IsOptional()
  description?: string;
}
