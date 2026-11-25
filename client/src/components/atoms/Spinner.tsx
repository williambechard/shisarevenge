// Visual spinner. The surrounding message carries the meaning, so the spinner is hidden from screen readers.
export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-4 animate-spin rounded-full border-2 border-navy/30 border-t-navy"
    />
  );
}
