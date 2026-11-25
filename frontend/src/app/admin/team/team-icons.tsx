type IconProps = {
  className?: string;
};

export function SearchIcon({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" height="16" viewBox="0 0 16 16" width="16">
    <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="m10.2 10.2 2.8 2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
  </svg>;
}

export function PlusIcon({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" height="16" viewBox="0 0 16 16" width="16">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
  </svg>;
}

export function CloseIcon({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" height="18" viewBox="0 0 18 18" width="18">
    <path d="m4 4 10 10M14 4 4 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
  </svg>;
}

export function MailIcon({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" height="16" viewBox="0 0 16 16" width="16">
    <rect height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" width="12.5" x="1.75" y="3.25" />
    <path d="m2.5 4 5.5 4.5L13.5 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
  </svg>;
}

export function ChevronRightIcon({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" height="16" viewBox="0 0 16 16" width="16">
    <path d="m6 3.5 4.5 4.5L6 12.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
  </svg>;
}

export function CheckIcon({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" height="14" viewBox="0 0 14 14" width="14">
    <path d="m3 7.25 2.5 2.5L11 4.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  </svg>;
}

export function UserIcon({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} fill="none" height="16" viewBox="0 0 16 16" width="16">
    <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M3.5 13c.25-2.25 2-3.5 4.5-3.5s4.25 1.25 4.5 3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
  </svg>;
}
