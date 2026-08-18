export function ScanInput() {
  return (
    <form className="rounded-lg border border-ink/12 bg-white p-3 shadow-soft">
      <label className="sr-only" htmlFor="restaurant-url">
        Restaurant website URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="min-h-12 flex-1 rounded-md border border-ink/15 bg-paper px-4 text-base text-ink outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/15"
          id="restaurant-url"
          name="restaurant-url"
          placeholder="https://yourrestaurant.com"
          type="url"
        />
        <button
          className="min-h-12 rounded-md bg-ink px-5 text-base font-semibold text-white opacity-55"
          disabled
          type="button"
        >
          Scan unavailable
        </button>
      </div>
      <p className="mt-3 px-1 text-sm leading-6 text-ink/62">
        Scanning is not implemented in this foundation pass.
      </p>
    </form>
  );
}
