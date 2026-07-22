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
  /** Inline (desktop bar) or stacked (mobile sheet). */
  layout?: 'inline' | 'stack';
  /** Optional lighter sub-heading style (used for the cascaded country row). */
  subdued?: boolean;
}

/**
 * A single facet rendered as real, restyled checkboxes (PRD §8). Zero-yield
 * options render at 40% opacity and are not selectable (PRD §5.3); selected
 * options stay clickable so they can be turned off.
 */
export default function FilterGroup({
  label,
  options,
  selected,
  onToggle,
  name,
  layout = 'inline',
  subdued = false,
}: FilterGroupProps) {
  if (options.length === 0) return null;

  return (
    <div
      className={
        layout === 'inline'
          ? 'flex flex-wrap items-baseline gap-x-4 gap-y-2'
          : 'flex flex-col gap-3'
      }
    >
      <span
        className={subdued ? 'text-ink-tertiary' : 'text-ink-secondary'}
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}
      >
        {label}
      </span>
      <div
        className={
          layout === 'inline'
            ? 'flex flex-wrap items-baseline gap-x-4 gap-y-2'
            : 'flex flex-col gap-3'
        }
      >
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          const disabled = opt.count === 0 && !isSelected;
          const id = `${name}-${opt.value}`;
          return (
            <label
              key={opt.value}
              htmlFor={id}
              className="group inline-flex cursor-pointer items-baseline gap-1.5 select-none"
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
                className="border-b transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: isSelected ? '#1A1A1A' : '#6B6B6B',
                  borderColor: isSelected ? '#1A1A1A' : 'transparent',
                  paddingBottom: '1px',
                }}
              >
                {opt.label}
              </span>
              <span
                aria-hidden="true"
                className="text-ink-tertiary tabular-nums"
                style={{ fontSize: '10px' }}
              >
                {opt.count}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
