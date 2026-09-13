import { afterEach, describe, expect, mock, test } from "bun:test";
import { SiecsClient, SiecsError } from "../src/client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch(response: Response) {
  const fetchMock = mock(async () => response);
  globalThis.fetch = fetchMock as typeof fetch;
  return fetchMock;
}

describe("SiecsClient entity mutations", () => {
  test("posts a component value", async () => {
    const component = { id: 7, name: "Health", value: 100 };
    const fetchMock = mockFetch(Response.json(component));

    await expect(new SiecsClient().addComponent(42, 7, 100)).resolves.toEqual(component);
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4040/entities/42/components/7", {
      headers: { accept: "application/json", "content-type": "application/json" },
      method: "POST",
      body: JSON.stringify({ value: 100 }),
    });
  });

  test("adds a component with its server default when no value is provided", async () => {
    const component = { id: 8, name: "Transform", value: {} };
    const fetchMock = mockFetch(Response.json(component));

    await expect(new SiecsClient().addComponent(42, 8)).resolves.toEqual(component);
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4040/entities/42/components/8", {
      headers: { accept: "application/json", "content-type": "application/json" },
      method: "POST",
      body: JSON.stringify({}),
    });
  });

  test("deletes a component and accepts a 204 response", async () => {
    const fetchMock = mockFetch(new Response(null, { status: 204 }));

    await expect(new SiecsClient().removeComponent(42, 7)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4040/entities/42/components/7", {
      headers: { accept: "application/json" },
      method: "DELETE",
      body: undefined,
    });
  });

  test("puts a relation target", async () => {
    const relation = {
      id: 3,
      name: "ChildOf",
      target: { name: "Scene", index: 15, generation: 2 },
    };
    const fetchMock = mockFetch(Response.json(relation));

    await expect(new SiecsClient().setRelation(42, 3, relation.target)).resolves.toEqual(relation);
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4040/entities/42/relations/3", {
      headers: { accept: "application/json", "content-type": "application/json" },
      method: "PUT",
      body: JSON.stringify({ target: 15 }),
    });
  });

  test("deletes a relation", async () => {
    const fetchMock = mockFetch(new Response(null, { status: 204 }));

    await expect(new SiecsClient().removeRelation(42, 3)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4040/entities/42/relations/3", {
      headers: { accept: "application/json" },
      method: "DELETE",
      body: undefined,
    });
  });

  test("exposes the server message and status on request errors", async () => {
    mockFetch(Response.json({ message: "This relation would create a cycle." }, { status: 409 }));

    try {
      await new SiecsClient().setRelation(42, 3, 15);
      throw new Error("Expected setRelation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(SiecsError);
      expect((error as SiecsError).status).toBe(409);
      expect((error as Error).message).toContain("This relation would create a cycle.");
    }
  });
});

describe("SiecsClient scene binary operations", () => {
  test("downloads the scene as an untouched binary blob", async () => {
    const bytes = new Uint8Array([0x00, 0xff, 0x01, 0x7f]);
    const fetchMock = mockFetch(
      new Response(new Blob([bytes], { type: "application/octet-stream" }), { status: 200 }),
    );

    const blob = await new SiecsClient().saveScene();

    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4040/scene", {
      method: "GET",
      headers: { accept: "application/octet-stream" },
    });
  });

  test("uploads the exact binary body and accepts 204", async () => {
    const data = new Blob([new Uint8Array([0x00, 0x02, 0xfe])], {
      type: "application/octet-stream",
    });
    const fetchMock = mockFetch(new Response(null, { status: 204 }));

    await expect(new SiecsClient().loadScene(data)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4040/scene", {
      method: "POST",
      headers: { "content-type": "application/octet-stream" },
      body: data,
    });
  });
});
