import { z } from "zod";
import { apiGet } from "../client.js";

export const searchSchema = z.object({
  query: z.string().describe("Поисковый запрос (мин. 3 символа)"),
  limit: z.number().optional().describe("Количество результатов (макс 250, по умолчанию 50)"),
});

export async function handleSearch(params: z.infer<typeof searchSchema>): Promise<string> {
  const queryParams: Record<string, string> = { query: params.query };
  if (params.limit) queryParams.limit = String(params.limit);

  const data = await apiGet<unknown>("/search", queryParams);
  return JSON.stringify(data, null, 2);
}
