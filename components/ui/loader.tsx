import * as React from "react";

interface LoaderProps {
  label?: string;
  className?: string;
}

export function Loader({ label = "Loading", className }: LoaderProps) {
  return (
    <div className={className} role="status" aria-label={label}>
      <span className="loader" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
