import { z } from 'zod';

export const SubscribeDto = z.object({
  packageId: z.string().cuid('packageId harus berupa CUID yang valid'),
});

export type SubscribeType = z.infer<typeof SubscribeDto>;
