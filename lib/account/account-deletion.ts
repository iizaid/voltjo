export const ACCOUNT_DELETION_CONFIRMATION_TEXT = "حذف حسابي";

export function normalizeAccountEmail(input: string | null | undefined) {
  return input?.trim().toLowerCase() ?? "";
}

export function isAccountDeletionConfirmationValid({
  confirmationText,
  typedEmail,
  currentEmail,
}: {
  confirmationText: string;
  typedEmail: string;
  currentEmail: string | null | undefined;
}) {
  if (confirmationText.trim() !== ACCOUNT_DELETION_CONFIRMATION_TEXT) {
    return false;
  }

  const normalizedCurrentEmail = normalizeAccountEmail(currentEmail);
  if (!normalizedCurrentEmail) return true;

  return normalizeAccountEmail(typedEmail) === normalizedCurrentEmail;
}
