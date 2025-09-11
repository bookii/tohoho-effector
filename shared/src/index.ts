import { z } from "zod";

export const irisOutEffectFacePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  bitmapWidth: z.number(),
  bitmapHeight: z.number(),
});

export const irisOutEffectStepSchema = z.enum(["none", "focused", "hidden"]);

export const irisOutEffectStateSchema = z.object({
  step: irisOutEffectStepSchema,
  facePosition: irisOutEffectFacePositionSchema.optional(),
});

export const getStreamQuerySchema = z
  .object({
    source_id: z.string(),
  })
  .transform((data) => {
    return {
      sourceId: data.source_id,
    };
  });

export const deleteStreamQuerySchema = z
  .object({
    source_id: z.string(),
  })
  .transform((data) => {
    return {
      sourceId: data.source_id,
    };
  });

export type IrisOutEffectFacePosition = z.infer<
  typeof irisOutEffectFacePositionSchema
>;
export type IrisOutEffectStep = z.infer<typeof irisOutEffectStepSchema>;
export type IrisOutEffectState = z.infer<typeof irisOutEffectStateSchema>;
export type GetStreamQuery = z.infer<typeof getStreamQuerySchema>;
export type DeleteStreamQuery = z.infer<typeof deleteStreamQuerySchema>;
