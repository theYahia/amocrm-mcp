import { z } from "zod";
import { apiPost } from "../client.js";

export const addNoteSchema = z.object({
  entity_id: z.number().describe("ID сущности"),
  entity_type: z.enum(["leads", "contacts", "companies"]).describe("Тип сущности"),
  note_type: z.enum(["common", "call_in", "call_out", "service_message"]).optional()
    .describe("Тип примечания (по умолчанию common)"),
  text: z.string().describe("Текст примечания"),
});

export async function handleAddNote(params: z.infer<typeof addNoteSchema>): Promise<string> {
  const { entity_id, entity_type, note_type, text } = params;

  const body = [{
    note_type: note_type ?? "common",
    params: { text },
  }];

  const data = await apiPost<unknown>(`/${entity_type}/${entity_id}/notes`, body);
  return JSON.stringify(data, null, 2);
}
