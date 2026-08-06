import { z } from 'zod';
import { CreatePaymentMethodSchema } from './create-payment-method.dto';

export const UpdatePaymentMethodSchema = CreatePaymentMethodSchema.partial();

export type UpdatePaymentMethodDto = z.infer<typeof UpdatePaymentMethodSchema>;
