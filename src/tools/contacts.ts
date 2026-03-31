import { z } from "zod";
import { apiGet, apiPost } from "../client.js";

export const getContactsSchema = z.object({
  page: z.number().optional().describe("Номер страницы (по умолчанию 1)"),
  limit: z.number().optional().describe("Количество на странице (макс 250, по умолчанию 50)"),
  query: z.string().optional().describe("Поисковый запрос по имени контакта"),
});

export async function handleGetContacts(params: z.infer<typeof getContactsSchema>): Promise<string> {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.limit) queryParams.limit = String(params.limit);
  if (params.query) queryParams.query = params.query;

  const data = await apiGet<unknown>("/contacts", queryParams);
  return JSON.stringify(data, null, 2);
}

export const createContactSchema = z.object({
  name: z.string().optional().describe("Полное имя контакта"),
  first_name: z.string().optional().describe("Имя"),
  last_name: z.string().optional().describe("Фамилия"),
  responsible_user_id: z.number().optional().describe("ID ответственного пользователя"),
});

export async function handleCreateContact(params: z.infer<typeof createContactSchema>): Promise<string> {
  const body = [params];
  const data = await apiPost<unknown>("/contacts", body);
  return JSON.stringify(data, null, 2);
}
