import { z } from "zod";
import { apiGet, apiPost } from "../client.js";

export const getLeadsSchema = z.object({
  page: z.number().optional().describe("Номер страницы (по умолчанию 1)"),
  limit: z.number().optional().describe("Количество на странице (макс 250, по умолчанию 50)"),
  query: z.string().optional().describe("Поисковый запрос по названию сделки"),
});

export async function handleGetLeads(params: z.infer<typeof getLeadsSchema>): Promise<string> {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.limit) queryParams.limit = String(params.limit);
  if (params.query) queryParams.query = params.query;

  const data = await apiGet<unknown>("/leads", queryParams);
  return JSON.stringify(data, null, 2);
}

export const createLeadSchema = z.object({
  name: z.string().describe("Название сделки"),
  price: z.number().optional().describe("Бюджет сделки"),
  pipeline_id: z.number().optional().describe("ID воронки"),
  status_id: z.number().optional().describe("ID статуса в воронке"),
  responsible_user_id: z.number().optional().describe("ID ответственного пользователя"),
});

export async function handleCreateLead(params: z.infer<typeof createLeadSchema>): Promise<string> {
  const body = [params];
  const data = await apiPost<unknown>("/leads", body);
  return JSON.stringify(data, null, 2);
}
