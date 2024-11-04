import * as z from "zod";

export const WebhookEventUpdatesSchema = z.object({
  title: z.string().optional(),
  type: z.string().optional(),
  private: z.string().optional(),
  authorized: z.literal('false').optional(),
});

export const WebhookEventSchema = z.object({
  aspect_type: z.enum(['create', 'update', 'delete']),
  event_time: z.number(),
  object_id: z.number(),
  object_type: z.enum(['activity', 'athlete']),
  owner_id: z.number(),
  subscription_id: z.number(),
  updates: WebhookEventUpdatesSchema.optional(),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
