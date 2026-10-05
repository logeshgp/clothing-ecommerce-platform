import { COLOR_SWATCHES } from '../../data/taxonomy';
import { classNames } from '../../utils/format';

export function ColorSwatch({ color, selected = false, size = 'md', as: Tag = 'span', ...props }) {
  const hex = COLOR_SWATCHES[color] ?? '#ddd5c5';
  const dimensions = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-9 w-9' : 'h-6 w-6';

  return (
    <Tag
      {...props}
      title={color}
      className={classNames(
        'inline-block rounded-full ring-1 ring-inset ring-ink-900/15 transition-all duration-200',
        dimensions,
        selected && 'ring-2 ring-offset-2 ring-offset-sand-100 ring-ink-900',
        props.className,
      )}
      style={{ backgroundColor: hex, ...props.style }}
    />
  );
}

export function ColorSwatchButton({ color, selected, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(color)}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`Colour: ${color}`}
      className={classNames(
        'group relative inline-flex items-center justify-center rounded-full p-0.5',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      <ColorSwatch color={color} selected={selected} size="lg" />
    </button>
  );
}
