import { handler } from "../src/getProducts";

describe("[getProducts]", () => {
  it("should not crash", async () => {
    await handler(null, null, null);
  });
});
