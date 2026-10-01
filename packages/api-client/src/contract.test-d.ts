import { describe, expectTypeOf, it } from "vitest";

import type {
  ApiClient,
  InferRequestType,
  InferResponseType,
} from "./index.ts";

/** Compile-time contract: if the API's routes change shape, this file stops typechecking. */
describe("api client contract", () => {
  it("types reader responses from the API's schemas", () => {
    type PostDetail = InferResponseType<
      ApiClient["api"]["posts"][":slug"]["$get"],
      200
    >;

    expectTypeOf<PostDetail["slug"]>().toEqualTypeOf<string>();
    expectTypeOf<PostDetail["locale"]>().toEqualTypeOf<"en" | "tr">();
  });

  it("types request bodies", () => {
    type ContactBody = InferRequestType<
      ApiClient["api"]["contact"]["$post"]
    >["json"];

    expectTypeOf<ContactBody>().toHaveProperty("turnstileToken");
  });
});
