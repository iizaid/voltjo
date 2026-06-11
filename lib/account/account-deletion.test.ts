import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DELETION_CONFIRMATION_TEXT,
  isAccountDeletionConfirmationValid,
} from "@/lib/account/account-deletion";

describe("isAccountDeletionConfirmationValid", () => {
  it("requires the Arabic deletion confirmation phrase", () => {
    expect(
      isAccountDeletionConfirmationValid({
        confirmationText: ACCOUNT_DELETION_CONFIRMATION_TEXT,
        typedEmail: "",
        currentEmail: null,
      }),
    ).toBe(true);

    expect(
      isAccountDeletionConfirmationValid({
        confirmationText: "حذف",
        typedEmail: "",
        currentEmail: null,
      }),
    ).toBe(false);
  });

  it("requires the current email when one is available", () => {
    expect(
      isAccountDeletionConfirmationValid({
        confirmationText: ACCOUNT_DELETION_CONFIRMATION_TEXT,
        typedEmail: "USER@Example.COM ",
        currentEmail: "user@example.com",
      }),
    ).toBe(true);

    expect(
      isAccountDeletionConfirmationValid({
        confirmationText: ACCOUNT_DELETION_CONFIRMATION_TEXT,
        typedEmail: "other@example.com",
        currentEmail: "user@example.com",
      }),
    ).toBe(false);
  });
});
