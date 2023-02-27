import { handler } from "../src/getProductById";

describe("[getProductById]", () => {
  it("should not crash", async () => {
    await handler({} as any, null, null);
  });
});
