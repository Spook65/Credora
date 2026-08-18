import { ScanInput } from "../components/ScanInput";

const checks = [
  "Menu, hours, phone, and location visibility",
  "Contact, reservation, order, and directions paths",
  "Basic metadata and structured business information",
  "Trust basics such as HTTPS and privacy-link presence"
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-ink/10 pb-5">
          <a className="font-serif text-2xl font-semibold" href="/">
            Credora
          </a>
          <span className="rounded-full border border-moss/25 px-3 py-1 text-sm font-medium text-moss">
            Foundation preview
          </span>
        </header>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-clay">
              Restaurant website checkup
            </p>
            <h1 className="font-serif text-5xl font-semibold leading-tight sm:text-6xl lg:text-7xl">
              See your restaurant the way a new customer sees it.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink/75">
              Credora is being shaped into an evidence-backed local presence
              report for restaurants. This foundation only confirms the app
              shell is ready; website scanning has not been implemented.
            </p>

            <div className="mt-9 max-w-xl">
              <ScanInput />
            </div>
          </div>

          <aside className="border-l-0 border-ink/10 lg:border-l lg:pl-10">
            <div className="rounded-lg border border-ink/10 bg-white/70 p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">
                Planned scan areas
              </p>
              <ul className="mt-5 space-y-4">
                {checks.map((check) => (
                  <li className="flex gap-3 text-base leading-7 text-ink/78" key={check}>
                    <span
                      aria-hidden="true"
                      className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-moss"
                    />
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-ink/10 pt-5 text-sm leading-6 text-ink/62">
                Future findings must be tied to detected evidence and written
                with cautious language. No reputation scores, review scraping,
                or unsupported ranking claims belong in this MVP.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
