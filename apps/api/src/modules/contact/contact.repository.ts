import { db, generateId } from "@orkide/db";
import { contactMessage } from "@orkide/db/schema";
import { eq } from "drizzle-orm";

type NewMessage = Omit<
  typeof contactMessage.$inferInsert,
  "id" | "createdAt" | "updatedAt" | "status"
>;
type Status = (typeof contactMessage.$inferSelect)["status"];

export const create = async (message: NewMessage): Promise<string> => {
  const id = generateId();
  await db.insert(contactMessage).values({ ...message, id });
  return id;
};

export const findById = (id: string) =>
  db.query.contactMessage.findFirst({ where: { id } });

export const list = (status?: Status) =>
  db.query.contactMessage.findMany({
    columns: { ipHash: false },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    where: status ? { status } : {},
  });

export const updateStatus = async (
  id: string,
  status: Status
): Promise<boolean> => {
  const updated = await db
    .update(contactMessage)
    .set({ status })
    .where(eq(contactMessage.id, id))
    .returning({ id: contactMessage.id });
  return updated.length > 0;
};

export const remove = async (id: string): Promise<boolean> => {
  const deleted = await db
    .delete(contactMessage)
    .where(eq(contactMessage.id, id))
    .returning({ id: contactMessage.id });
  return deleted.length > 0;
};
