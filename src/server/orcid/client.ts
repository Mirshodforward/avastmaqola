import "server-only";

export type OrcidLookup =
  | { status: "found"; name: string | null }
  | { status: "not_found" }
  | { status: "unavailable" };

type OrcidValue = { value?: string } | null | undefined;
type OrcidPerson = {
  name?: {
    "given-names"?: OrcidValue;
    "family-name"?: OrcidValue;
    "credit-name"?: OrcidValue;
  } | null;
};

/** ORCID Public API orqali iD mavjudligini tekshiradi va ochiq ko‘rsatilgan ismni qaytaradi. */
export async function lookupOrcid(orcid: string): Promise<OrcidLookup> {
  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${orcid}/person`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    // 404 — bunday iD yo‘q; 409/410 — profil o‘chirilgan, birlashtirilgan yoki bloklangan
    if (res.status === 404 || res.status === 409 || res.status === 410) return { status: "not_found" };
    if (!res.ok) return { status: "unavailable" };

    const person = (await res.json()) as OrcidPerson;
    const credit = person.name?.["credit-name"]?.value;
    const full = [person.name?.["given-names"]?.value, person.name?.["family-name"]?.value]
      .filter(Boolean)
      .join(" ");
    return { status: "found", name: credit || full || null };
  } catch {
    return { status: "unavailable" };
  }
}
