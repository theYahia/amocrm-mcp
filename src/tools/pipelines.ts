import { z } from "zod";
import { apiGet } from "../client.js";

export const getPipelinesSchema = z.object({});

export async function handleGetPipelines(_params: z.infer<typeof getPipelinesSchema>): Promise<string> {
  const data = await apiGet<unknown>("/leads/pipelines");
  return JSON.stringify(data, null, 2);
}
