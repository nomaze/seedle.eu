import "server-only";

import { currentUser, type CurrentUser } from "./session";
import { createField, getField, type Field } from "./services/fields";

/** Page helper for /feld/[fieldId]: loads user and field record, synthesizing a fallback field if needed so dynamic IDs never 404. */
export async function requireField(fieldId: string): Promise<{ user: CurrentUser; field: Field }> {
  const user = await currentUser();
  let field = await getField(user.id, fieldId);
  if (!field) {
    field = await createField(user.id, {
      id: fieldId,
      name: "Mein Feld",
      point: { lat: 48.402, lon: 11.728 },
      crop: "mais",
      usage: "silomais",
    });
  }
  return { user, field };
}
