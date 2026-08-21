'use client';

import { useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'copied' | 'error';

/**
 * Synchronous clipboard write via a throwaway textarea. Restores whatever the
 * user had selected, so copying a code doesn't clobber their own selection.
 * `setSelectionRange` rather than `select()` alone — iOS Safari ignores the latter.
 */
function legacyCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  // Off-screen but still focusable; `display: none` would make it unselectable.
  ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
  document.body.appendChild(ta);

  const selection = document.getSelection();
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }

  document.body.removeChild(ta);
  if (previous && selection) {
    selection.removeAllRanges();
    selection.addRange(previous);
  }
  return ok;
}

const LABEL: Record<Status, string> = {
  idle: 'Copy',
  copied: 'Copied',
  error: 'Copy failed',
};

/**
 * Promo-code chip (PRD §4.3). Same shape as the active-filter chip in
 * FilterBar — this is the site's only "removable token" idiom, and a promo code
 * is the same kind of object.
 *
 * The only client component on /partnerships, which is why it's split out of
 * OfferRow rather than making the whole offer list interactive.
 */
export default function CopyCode({ code }: { code: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 2500);
  }

  async function copy() {
    let ok = false;
    try {
      // Undefined in insecure contexts (e.g. opening the dev server over a LAN
      // IP rather than localhost), so this is a check, not a formality.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        ok = true;
      }
    } catch {
      ok = false;
    }

    // The async Clipboard API rejects with "Document is not focused" when the
    // window wasn't focused at the moment the promise resolved — which is
    // exactly what happens on the *first* click after switching back from
    // another window. The click focuses the page, but the focus check has
    // already run. Hence "it only works on the second click".
    //
    // execCommand is deprecated but synchronous: it runs inside the click's own
    // task, while the document is unambiguously focused, so the first click
    // works. Kept strictly as a fallback, never the primary path.
    if (!ok) ok = legacyCopy(code);

    setStatus(ok ? 'copied' : 'error');
    reset();
  }

  return (
    <span className="inline-flex items-center gap-2">
      {/* Labelled, not bare: on its own a chip reading "HILARY" is just a word.
          The label says what it is, the divided "Copy" says it's actionable. */}
      <span
        className="text-ink-tertiary"
        style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}
      >
        Promo code
      </span>
      {/* Taller on mobile — `py-1` alone leaves a ~25px tap target. */}
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy promo code ${code}`}
        className="inline-flex items-center gap-2 rounded-full border border-rule px-3 py-2 text-ink transition-colors hover:border-ink md:px-2.5 md:py-1"
        style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}
      >
        {code}
        {/* Fixed width so swapping Copy → Copied can't shift the row. The error
            label is wider and will nudge it, which is fine for a rare state. */}
        <span
          aria-hidden
          className="inline-block border-l border-rule pl-2 text-ink-tertiary"
          style={{ minWidth: '4.4em' }}
        >
          {LABEL[status]}
        </span>
      </button>
      {/* Announced, not shown — a tooltip would be invisible to a screen reader
          and to touch users (PRD §4.3). On failure it reads the code aloud so
          the interaction still has an exit. */}
      <span aria-live="polite" className="sr-only">
        {status === 'copied' && 'Code copied'}
        {status === 'error' && `Copy failed. The code is ${code}.`}
      </span>
    </span>
  );
}
