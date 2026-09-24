/**
 * Tile-caption short forms for film stocks.
 *
 * Unlike data/cameras.ts this is a lookup, not a closed set: `photos.json`
 * stores the stock as written, so anything unregistered simply falls through
 * as-is. Registering a stock costs nothing — PhotoTile shows the full name
 * whenever it fits and only reaches for the short form in a narrow column.
 *
 * The convention for `short`, in the order the rules apply:
 *
 *   1. Drop the manufacturer where the line name stands on its own. Anyone who
 *      knows Gold knows it is Kodak; nobody says "Kodak Gold 200" out loud.
 *   2. Drop an ISO *range*. The "100-400" on Metropolis is shooting latitude —
 *      the band you may rate it at — not part of the name. A single ISO stays.
 *   3. Keep the ISO where it separates siblings in a line: Vision3 500T from
 *      250D, CineStill 800T from 400D, Portra 400 from 800.
 *   4. Stop at what a film photographer would actually say. "Metropolis" is
 *      the name in use; "LCM" is not.
 *
 * Aeronega 100, Cinestill 400D and Fujicolor 100 are deliberately absent: each
 * is already at its conventional name. Cutting further ( "400D", "Fuji 100" )
 * would buy a few px by crossing from what photographers say into what only an
 * insider decodes, which is rule 4's whole point. They fall back to
 * `{country} · {year}` in a narrow column instead.
 */
export const FILM_STOCK_SHORT: Record<string, string> = {
  // Rules 2 + 1: the range is latitude, and the line is just "Metropolis".
  'LomoChrome Metropolis 100-400': 'Metropolis',
  // Rule 1 + 3: Kodak is redundant, 500T is not.
  'Kodak Vision3 500T': 'Vision3 500T',
  'Kodak Gold 200': 'Gold 200',
  // Rule 1: ORWO is the maker, Wolfen NC500 is the film.
  'ORWO Wolfen NC500': 'Wolfen NC500',
  'Shanghai GP3 400': 'GP3 400',
  // Rule 1: Silberra is the distinctive half, "Color" is filler.
  'Silberra Color 50': 'Silberra 50',
};

/** The caption form of a stock — the full name unless a short one is registered. */
export function filmStockShort(stock: string): string {
  return FILM_STOCK_SHORT[stock] ?? stock;
}
