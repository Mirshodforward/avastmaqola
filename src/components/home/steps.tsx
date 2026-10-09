import Link from "next/link";
import { PORTAL_STEPS } from "@/lib/portal";
import { HomeSection } from "./home-section";

export function HomeSteps() {
  return (
    <HomeSection
      id="steps-title"
      title="Maqola qanday joylanadi"
      action={
        <Link href="/haqida" className="link">
          Portal haqida
        </Link>
      }
    >
      <ol className="grid gap-4 sm:grid-cols-2">
        {PORTAL_STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-xl border border-line bg-paper p-5">
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-lapis font-serif text-lg font-semibold text-on-lapis"
            >
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </HomeSection>
  );
}
