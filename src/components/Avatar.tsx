const SIZES = {
  xs: "w-5 h-5 text-[10px]",
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-14 h-14 text-xl",
} as const;

export function Avatar({
  name,
  color,
  size = "md",
  ring = false,
}: {
  name: string;
  color: string;
  size?: keyof typeof SIZES;
  ring?: boolean;
}) {
  return (
    <span
      className={`${SIZES[size]} rounded-full grid place-items-center font-bold text-white shrink-0 select-none ${
        ring ? "ring-2 ring-card" : ""
      }`}
      style={{ background: `linear-gradient(140deg, ${color}, color-mix(in srgb, ${color} 65%, #000))` }}
      aria-hidden
    >
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
