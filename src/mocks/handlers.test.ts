import { describe, expect, it } from "vitest";

import { connectorsApi, ApiError } from "@/lib/api";

/**
 * The mock API tested at its own boundary, without React.
 *
 * These exist because the UI validates before it sends, which means the
 * server-side checks are unreachable from an integration test: a bad name never
 * leaves the browser. That is the correct arrangement for a user, and it is
 * exactly why the mock needs its own tests. The point of sharing one schema
 * between the form and the handler is that the handler survives a request the
 * UI never made, and this is the only place that claim is actually checked.
 *
 * Mutation testing is what surfaced the gap: deleting the schema check from the
 * PATCH handler broke nothing, because no test had ever reached it.
 */

async function expectApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("Expected the request to fail");
}

describe("PATCH /api/connectors/:id", () => {
  it("renames a connector and persists it", async () => {
    const updated = await connectorsApi.update("cx_1", { name: "renamed-connector" });
    expect(updated.name).toBe("renamed-connector");

    const listed = await connectorsApi.list();
    expect(listed.find((c) => c.id === "cx_1")?.name).toBe("renamed-connector");
  });

  it("leaves every other field untouched", async () => {
    const before = (await connectorsApi.list()).find((c) => c.id === "cx_3");
    const updated = await connectorsApi.update("cx_3", { name: "warehouse-eu" });

    expect(updated).toEqual({ ...before, name: "warehouse-eu" });
  });

  it("rejects a name the schema does not accept", async () => {
    const error = await expectApiError(connectorsApi.update("cx_1", { name: "Prod US West" }));

    expect(error.detail.code).toBe("VALIDATION");
    expect(error.detail.message).toMatch(/lowercase letters, numbers, and hyphens/i);
  });

  it("rejects a name that is too short", async () => {
    const error = await expectApiError(connectorsApi.update("cx_1", { name: "a" }));
    expect(error.detail.code).toBe("VALIDATION");
  });

  it("rejects a name already taken by another connector", async () => {
    const error = await expectApiError(connectorsApi.update("cx_1", { name: "prod-eu-central" }));

    expect(error.detail.code).toBe("CONFLICT");
    expect(error.detail.message).toMatch(/already exists/i);
  });

  it("allows a connector to keep its own name", async () => {
    const updated = await connectorsApi.update("cx_1", { name: "prod-us-west" });
    expect(updated.name).toBe("prod-us-west");
  });

  it("reports an unknown connector", async () => {
    const error = await expectApiError(connectorsApi.update("cx_nope", { name: "anything-here" }));
    expect(error.detail.code).toBe("NOT_FOUND");
  });

  it("does not change the list when a rename is rejected", async () => {
    const before = await connectorsApi.list();
    await expectApiError(connectorsApi.update("cx_1", { name: "prod-eu-central" }));

    expect(await connectorsApi.list()).toEqual(before);
  });
});
