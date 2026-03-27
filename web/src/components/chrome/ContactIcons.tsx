type IconProps = {
  className?: string;
};

export function MessengerIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <path
        d="M12 4C7.03 4 3 7.73 3 12.33c0 2.62 1.31 4.96 3.36 6.49V22l3.09-1.7c.82.23 1.67.36 2.55.36 4.97 0 9-3.73 9-8.33S16.97 4 12 4Z"
        fill="currentColor"
      />
      <path
        d="m8.14 14.3 2.59-2.75 1.93 1.49 2.56-2.75-2.84 1.52-1.87-1.52-2.37 4.01Z"
        fill="white"
      />
    </svg>
  );
}

export function ZaloIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <rect x="3" y="4" width="18" height="16" rx="5" fill="currentColor" />
      <path
        d="M8.1 9.2h7.8v1.15l-5.12 4.45h5.12V16H8v-1.16l5.08-4.44H8.1V9.2Z"
        fill="white"
      />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <path
        d="M7.83 4.5h2.09c.38 0 .71.26.81.62l.7 2.66a.84.84 0 0 1-.24.83l-1.1 1.08a12.7 12.7 0 0 0 4.22 4.22l1.08-1.1a.84.84 0 0 1 .83-.24l2.66.7c.36.1.62.43.62.81v2.09c0 .46-.38.83-.84.83h-.49C9.92 18.51 5.5 14.08 5.5 8.67v-.49c0-.46.37-.84.83-.84Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FormIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <path
        d="M7 4.75h7.7L19 9.05V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.75a2 2 0 0 1 2-2Z"
        fill="currentColor"
      />
      <path d="M14.5 4.75v4.3H19" stroke="white" strokeWidth="1.35" strokeLinejoin="round" />
      <path d="M8.5 12h7M8.5 15h7" stroke="white" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}
