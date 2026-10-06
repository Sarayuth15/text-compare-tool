import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent/85 disabled:hover:bg-accent",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-background disabled:hover:bg-surface",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-2 py-1 text-xs pointer-coarse:min-h-9 pointer-coarse:px-3",
  md: "px-4 py-2 text-sm pointer-coarse:min-h-11",
};

export default function Button({
  variant = "secondary",
  size = "md",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}
