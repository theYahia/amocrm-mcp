import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.AMOCRM_DOMAIN = "test.amocrm.ru";
process.env.AMOCRM_ACCESS_TOKEN = "test-token";

import { _resetTokenState } from "../src/client.js";
import { handleGetLeads, handleCreateLead, handleUpdateLead } from "../src/tools/leads.js";
import { handleGetContacts, handleCreateContact } from "../src/tools/contacts.js";
import { handleGetCompanies } from "../src/tools/companies.js";
import { handleGetPipelines } from "../src/tools/pipelines.js";
import { handleCreateTask } from "../src/tools/tasks.js";
import { handleAddNote } from "../src/tools/notes.js";
import { handleSearch } from "../src/tools/search.js";

function mockFetchOk(data: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(data), { status: 200 }),
  );
}

describe("tools — all 10", () => {
  beforeEach(() => { _resetTokenState(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it("get_leads returns JSON", async () => {
    const data = { _embedded: { leads: [{ id: 1, name: "Deal" }] } };
    mockFetchOk(data);
    const result = await handleGetLeads({ page: 1, limit: 10 });
    expect(JSON.parse(result)).toEqual(data);
  });

  it("create_lead posts lead data", async () => {
    const resp = { _embedded: { leads: [{ id: 42 }] } };
    mockFetchOk(resp);
    const result = await handleCreateLead({ name: "New Deal", price: 10000 });
    expect(JSON.parse(result)._embedded.leads[0].id).toBe(42);
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body[0].name).toBe("New Deal");
  });

  it("update_lead patches lead", async () => {
    const resp = { id: 1, name: "Updated" };
    mockFetchOk(resp);
    const result = await handleUpdateLead({ id: 1, name: "Updated", price: 20000 });
    expect(JSON.parse(result).name).toBe("Updated");
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain("/leads/1");
    expect(call[1]?.method).toBe("PATCH");
  });

  it("get_contacts returns contacts", async () => {
    const data = { _embedded: { contacts: [{ id: 5, name: "John" }] } };
    mockFetchOk(data);
    const result = await handleGetContacts({});
    expect(JSON.parse(result)._embedded.contacts).toHaveLength(1);
  });

  it("create_contact posts contact", async () => {
    const resp = { _embedded: { contacts: [{ id: 10 }] } };
    mockFetchOk(resp);
    const result = await handleCreateContact({ name: "Jane Doe" });
    expect(JSON.parse(result)._embedded.contacts[0].id).toBe(10);
  });

  it("get_companies returns companies", async () => {
    const data = { _embedded: { companies: [{ id: 3, name: "Acme" }] } };
    mockFetchOk(data);
    const result = await handleGetCompanies({});
    expect(JSON.parse(result)._embedded.companies).toHaveLength(1);
  });

  it("get_pipelines returns pipelines", async () => {
    const data = { _embedded: { pipelines: [{ id: 1, name: "Main" }] } };
    mockFetchOk(data);
    const result = await handleGetPipelines({});
    expect(JSON.parse(result)._embedded.pipelines).toHaveLength(1);
  });

  it("create_task posts task", async () => {
    const resp = { _embedded: { tasks: [{ id: 77 }] } };
    mockFetchOk(resp);
    const result = await handleCreateTask({
      text: "Call client",
      entity_id: 1,
      entity_type: "leads",
      complete_till: 1700000000,
    });
    expect(JSON.parse(result)._embedded.tasks[0].id).toBe(77);
  });

  it("add_note posts note to entity", async () => {
    const resp = { _embedded: { notes: [{ id: 88 }] } };
    mockFetchOk(resp);
    const result = await handleAddNote({
      entity_id: 1,
      entity_type: "leads",
      text: "Important note",
    });
    expect(JSON.parse(result)._embedded.notes[0].id).toBe(88);
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain("/leads/1/notes");
  });

  it("search sends query param", async () => {
    const data = { _embedded: { items: [{ id: 1 }] } };
    mockFetchOk(data);
    const result = await handleSearch({ query: "test company" });
    expect(JSON.parse(result)._embedded.items).toHaveLength(1);
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("query=test");
  });
});
