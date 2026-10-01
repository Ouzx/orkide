import { db, generateId } from "@orkide/db";
import { media, mediaTranslation } from "@orkide/db/schema";
import type { MediaUpdate } from "@orkide/validators/media";
import { eq } from "drizzle-orm";

export const findBySha = (sha256: string) =>
  db.query.media.findFirst({ where: { sha256 }, with: { translations: true } });

export const findById = (id: string) =>
  db.query.media.findFirst({ where: { id }, with: { translations: true } });

export const list = () =>
  db.query.media.findMany({
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    with: { translations: true },
  });

export interface MediaWrite {
  readonly key: string;
  readonly sha256: string;
  readonly mimeType: string;
  readonly size: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly placeholder: string | null;
  readonly uploaderId: string;
  readonly translations: MediaUpdate["translations"];
}

export const create = async ({
  translations,
  ...fields
}: MediaWrite): Promise<string> => {
  const id = generateId();
  await db.batch([
    db.insert(media).values({ ...fields, id }),
    ...(translations.length > 0
      ? [
          db.insert(mediaTranslation).values(
            translations.map((translation) => ({
              ...translation,
              caption: translation.caption ?? null,
              mediaId: id,
            }))
          ),
        ]
      : []),
  ]);
  return id;
};

export const updateTranslations = async (
  id: string,
  { translations }: MediaUpdate
): Promise<void> => {
  await db.batch([
    db.update(media).set({ updatedAt: new Date() }).where(eq(media.id, id)),
    db.delete(mediaTranslation).where(eq(mediaTranslation.mediaId, id)),
    db.insert(mediaTranslation).values(
      translations.map((translation) => ({
        ...translation,
        caption: translation.caption ?? null,
        mediaId: id,
      }))
    ),
  ]);
};

export const remove = async (id: string) => {
  const [deleted] = await db
    .delete(media)
    .where(eq(media.id, id))
    .returning({ key: media.key, sha256: media.sha256 });
  return deleted;
};
