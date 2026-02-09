import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('stripe_events')
export class StripeEvent {
  @PrimaryColumn()
  id: string;

  @CreateDateColumn()
  processedAt: Date;
}
