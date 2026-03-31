import { z } from "zod";
import { apiPost } from "../client.js";

export const createTaskSchema = z.object({
  text: z.string().describe("Текст задачи"),
  entity_id: z.number().describe("ID связанной сущности (сделка/контакт)"),
  entity_type: z.enum(["leads", "contacts", "companies"]).describe("Тип сущности"),
  complete_till: z.number().describe("Unix timestamp дедлайна"),
  task_type_id: z.number().optional().describe("Тип задачи (1=Звонок, 2=Встреча, 3=Письмо)"),
  responsible_user_id: z.number().optional().describe("ID ответственного"),
});

export async function handleCreateTask(params: z.infer<typeof createTaskSchema>): Promise<string> {
  const body = [params];
  const data = await apiPost<unknown>("/tasks", body);
  return JSON.stringify(data, null, 2);
}
