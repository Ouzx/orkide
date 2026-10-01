/**
 * Uploads one file as multipart (the API sniffs its real type, hashes and deduplicates it).
 * Plain `fetch`: the typed client does not model multipart bodies. Failures carry the API's
 * localized problem title.
 */
export const uploadMedia = async (file: File): Promise<void> => {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch("/api/admin/media", { body, method: "POST" });
  if (response.ok) {
    return;
  }
  const problem: unknown = await response.json().catch(() => null);
  const title =
    typeof problem === "object" &&
    problem !== null &&
    "title" in problem &&
    typeof problem.title === "string"
      ? problem.title
      : response.statusText;
  throw new Error(title);
};
