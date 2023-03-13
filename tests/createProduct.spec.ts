import { handler } from "../src/createProduct";

describe("[createProduct]", () => {
  it("should not crash", async () => {
    await handler(null, null, null);
  });
});
