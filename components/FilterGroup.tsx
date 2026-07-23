'use client';

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterGroupProps {
  /** Group heading, e.g. "LOCATION". */
  label: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  /** Unique per group, used to scope checkbox ids. */
  name: string;
  /**
   * inline — wrapping row; stack — vertical list (mobile sheet);
   * menu — full-width rows with the count right-aligned (desktop dropdowns).
   */
  layout?: 'inline' | 'stack' | 'menu';
  /** Optional lighter sub-heading style (used for the cascaded country row). */
  subdued?: boolean;
  /**
   * Hide the heading — used in single-facet dropdowns where the trigger above
   * already names the group and repeating it is noise.
   */
  showLabel?: boolean;
}

/**
 * A single facet rendered as real, restyled checkboxes (PRD §8). Zero-yield
 * options render at 40% opacity and are not selectable (PRD §5.3); selected
 * options stay clickable so they can be turned off. In `menu` layout the
 * selected affordance is a soft row fill (scannable at a glance) rather than
 * the link-like underline used in the inline/stack layouts.
 */
export default function FilterGroup({
  label,
  options,
  selected,
  onToggle,
  name,
  layout = 'inline',
  subdued = false,
  showLabel = true,
}: FilterGroupProps) {
  if (options.length === 0) return null;

  const menu = layout === 'menu';
  const stacked = layout === 'stack' || menu;

  return (
    <div className={stacked ? 'flex flex-col gap-2' : 'flex flex-wrap items-baseline gap-x-4 gap-y-2'}>
      {showLabel && (
        <span
          className={subdued ? 'text-ink-tertiary' : 'text-ink-secondary'}
          style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em' }}
        >
          {label}
        </span>
      )}
      <div className={stacked ? 'flex flex-col gap-0.5' : 'flex flex-wrap items-baseline gap-x-4 gap-y-2'}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          const disabled = opt.count === 0 && !isSelected;
          const id = `${name}-${opt.value}`;
          return (
            <label
              key={opt.value}
              htmlFor={id}
              className={
                menu
                  ? `group flex cursor-pointer select-none items-center justify-between gap-8 px-2.5 py-2 transition-colors ${
                      isSelected ? 'bg-rule/60' : 'hover:bg-rule/40'
                    }`
                  : 'group inline-flex cursor-pointer items-baseline gap-1.5 select-none'
              }
              style={disabled ? { opacity: 0.4, cursor: 'default' } : undefined}
            >
              <input
                id={id}
                type="checkbox"
                className="peer sr-only"
                checked={isSelected}
                disabled={disabled}
                onChange={() => onToggle(opt.value)}
              />
              <span
                className="whitespace-nowrap border-b transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: isSelected ? '#1A1A1A' : '#6B6B6B',
                  borderColor: !menu && isSelected ? '#1A1A1A' : 'transparent',
                  paddingBottom: '1px',
                }}
              >
                {opt.label}
              </span>
              <span aria-hidden="true" className="text-ink-tertiary tabular-nums" style={{ fontSize: '10px' }}>
                {opt.count}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
