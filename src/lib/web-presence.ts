// Internetdagi ma’lumotlar: server va klient o‘rtasidagi shakllar (faqat tiplar)

export type PresenceCategory = "profile" | "publication" | "mention";

/** exact — ORCID/OpenAlex yoki o‘qituvchining o‘z havolasi; likely — veb-qidiruvda topilgan, model "shu odam" degan */
export type PresenceConfidence = "exact" | "likely";

export type PresenceSource = "orcid" | "openalex" | "profile" | "web";

export type PresenceItem = {
  url: string;
  title: string;
  /** Sayt nomi: hostname, www’siz */
  site: string;
  category: PresenceCategory;
  confidence: PresenceConfidence;
  source: PresenceSource;
  year: number | null;
  /** Qisqa izoh (veb-topilmalarda model yozadi, tozalangan) */
  note: string | null;
};

export type PresenceResult = {
  items: PresenceItem[];
  /** Model "boshqa odam (adash)" deb topgan sahifalar soni — ro‘yxatda ko‘rsatilmaydi */
  namesakes: number;
  /** used — ORCID iD qidiruvda ishlatildi; mismatch — ORCID’dagi ism profildagiga mos kelmadi, ishlatilmadi */
  orcid: "used" | "none" | "mismatch";
};

/** Izlash oqimi (NDJSON): har qatorda bitta hodisa */
export type PresenceEvent = { t: "step"; v: string } | { t: "error"; message: string } | { t: "done" };
