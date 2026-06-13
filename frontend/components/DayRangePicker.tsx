"use client";
import clsx from "clsx";

const OPTIONS = [
  { label: "7d",  value: 7  },
  { label: "14d", value: 14 },
  { label: "30d", value: 30 },
  { label: "60d", value: 60 },
];

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function DayRangePicker({ value, onChange }: Props) {
  return (
    <div className="day-range-picker">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          className={clsx("day-range-btn", value === o.value && "active")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
