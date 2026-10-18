/** The hex SHA-256 digest of a UTF-8 string. */
export const sha256Hex = async (text: string): Promise<string> =>
  new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  ).toHex();
