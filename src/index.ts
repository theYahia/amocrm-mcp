#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getLeadsSchema, handleGetLeads, createLeadSchema, handleCreateLead, updateLeadSchema, handleUpdateLead } from "./tools/leads.js";
import { getContactsSchema, handleGetContacts, createContactSchema, handleCreateContact } from "./tools/contacts.js";
import { getCompaniesSchema, handleGetCompanies } from "./tools/companies.js";
import { getPipelinesSchema, handleGetPipelines } from "./tools/pipelines.js";
import { createTaskSchema, handleCreateTask } from "./tools/tasks.js";
import { addNoteSchema, handleAddNote } from "./tools/notes.js";
import { searchSchema, handleSearch } from "./tools/search.js";

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "amocrm-mcp",
    version: "1.1.0",
  });

  server.tool("get_leads", "Получить список сделок из amoCRM с фильтрацией и пагинацией.", getLeadsSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleGetLeads(params) }] }));

  server.tool("create_lead", "Создать новую сделку в amoCRM.", createLeadSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleCreateLead(params) }] }));

  server.tool("update_lead", "Обновить существующую сделку в amoCRM (название, бюджет, статус, воронку).", updateLeadSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleUpdateLead(params) }] }));

  server.tool("get_contacts", "Получить список контактов из amoCRM с фильтрацией и пагинацией.", getContactsSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleGetContacts(params) }] }));

  server.tool("create_contact", "Создать новый контакт в amoCRM.", createContactSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleCreateContact(params) }] }));

  server.tool("get_companies", "Получить список компаний из amoCRM с фильтрацией и пагинацией.", getCompaniesSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleGetCompanies(params) }] }));

  server.tool("get_pipelines", "Получить список воронок продаж и их статусов из amoCRM.", getPipelinesSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleGetPipelines(params) }] }));

  server.tool("create_task", "Создать задачу в amoCRM привязанную к сделке, контакту или компании.", createTaskSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleCreateTask(params) }] }));

  server.tool("add_note", "Добавить примечание к сделке, контакту или компании в amoCRM.", addNoteSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleAddNote(params) }] }));

  server.tool("search", "Универсальный поиск по amoCRM — сделки, контакты, компании.", searchSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleSearch(params) }] }));

  return server;
}

async function startStdio() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[amocrm-mcp] stdio: 10 tools ready. Requires AMOCRM_DOMAIN + AMOCRM_ACCESS_TOKEN.");
}

async function startHTTP(port: number) {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
  await server.connect(transport);

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/mcp" && (req.method === "POST" || req.method === "GET" || req.method === "DELETE")) {
      await transport.handleRequest(req, res);
    } else if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", tools: 10 }));
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  httpServer.listen(port, () => {
    console.error(`[amocrm-mcp] HTTP server listening on port ${port} — endpoint: POST /mcp`);
  });
}

const mode = process.argv[2];
if (mode === "--http") {
  const port = parseInt(process.argv[3] ?? "3000", 10);
  startHTTP(port).catch((e) => { console.error("[amocrm-mcp] HTTP start error:", e); process.exit(1); });
} else {
  startStdio().catch((e) => { console.error("[amocrm-mcp] Stdio start error:", e); process.exit(1); });
}
