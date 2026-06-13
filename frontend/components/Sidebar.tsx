"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV = [
  {
    section: "Monitor",
    items: [
      { href: "/",              label: "Overview",       icon: <GridIcon /> },
      { href: "/latency",       label: "Latency",        icon: <ClockIcon /> },
      { href: "/cost",          label: "Cost",           icon: <DollarIcon /> },
      { href: "/flags",         label: "Flags",          icon: <FlagIcon /> },
      { href: "/quality",       label: "Match Quality",  icon: <StarIcon /> },
      { href: "/conversations", label: "Bad Convos",     icon: <ChatIcon /> },
    ],
  },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sidebar">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="nav-section-label">{group.section}</p>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx("nav-item", path === item.href && "active")}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}

function GridIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function ClockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function DollarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
}
function FlagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>;
}
function StarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function ChatIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
