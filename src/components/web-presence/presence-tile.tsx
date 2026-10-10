import Link from "next/link";
import { formatDate } from "@/lib/format";
import { getPresence } from "@/server/web-presence/service";

/** Kabinetdagi 3-tugma: izlashni boshlamaydi, sahifani ochadi (izlash pullik — tasodifiy bosilmasin) */
export async function PresenceTile({ userId }: { userId: string }) {
  const { result, searchedAt, running } = await getPresence(userId);
  return (
    <Link
      href="/dashboard/internet"
      className="flex min-h-28 flex-col justify-center rounded-xl border border-line bg-paper px-6 py-5 transition-colors hover:border-lapis sm:col-span-2 lg:col-span-1"
    >
      <span className="flex items-baseline justify-between gap-4">
        <span className="font-serif text-xl font-semibold">Internetdagi ma’lumotlarim</span>
        {result && <span className="font-serif text-xl font-semibold tabular-nums text-muted">{result.items.length}</span>}
      </span>
      <span className="mt-1 text-sm text-muted">
        {running ? "Izlanmoqda…" : searchedAt ? `Oxirgi izlash: ${formatDate(searchedAt)}` : "Hali izlanmagan"}
      </span>
    </Link>
  );
}
