import { z } from "zod";
import { apiGet } from "../client.js";

export const getCompaniesSchema = z.object({
  page: z.number().optional().describe("Номер страницы (по умолчанию 1)"),
  limit: z.number().optional().describe("Количество на странице (макс 250, по умолчанию 50)"),
  query: z.string().optional().describe("Поисковый запрос по названию компании"),
});

export async function handleGetCompanies(params: z.infer<typeof getCompaniesSchema>): Promise<string> {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.limit) queryParams.limit = String(params.limit);
  if (params.query) queryParams.query = params.query;

  const data = await apiGet<unknown>("/companies", queryParams);
  return JSON.stringify(data, null, 2);
}
