#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getLeadsSchema, handleGetLeads, createLeadSchema, handleCreateLead } from "./tools/leads.js";
import { getContactsSchema, handleGetContacts, createContactSchema, handleCreateContact } from "./tools/contacts.js";
import { getPipelinesSchema, handleGetPipelines } from "./tools/pipelines.js";

const server = new McpServer({
  name: "amocrm-mcp",
  version: "1.0.0",
});

server.tool(
  "get_leads",
  "Получить список сделок из amoCRM с фильтрацией и пагинацией.",
  getLeadsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetLeads(params) }],
  }),
);

server.tool(
  "create_lead",
  "Создать новую сделку в amoCRM.",
  createLeadSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleCreateLead(params) }],
  }),
);

server.tool(
  "get_contacts",
  "Получить список контактов из amoCRM с фильтрацией и пагинацией.",
  getContactsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetContacts(params) }],
  }),
);

server.tool(
  "create_contact",
  "Создать новый контакт в amoCRM.",
  createContactSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleCreateContact(params) }],
  }),
);

server.tool(
  "get_pipelines",
  "Получить список воронок продаж и их статусов из amoCRM.",
  getPipelinesSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetPipelines(params) }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[amocrm-mcp] Сервер запущен. 5 инструментов. Требуется AMOCRM_DOMAIN и AMOCRM_ACCESS_TOKEN.");
}

main().catch((error) => {
  console.error("[amocrm-mcp] Ошибка запуска:", error);
  process.exit(1);
});
