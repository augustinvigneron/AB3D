import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  name: string;
  error?: string[] | string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

/** Enveloppe label + message d'erreur accessible pour un champ de formulaire. */
export function Field({ label, name, error, hint, required, children }: FieldProps) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
        {required && <span className="ml-1 text-danger" aria-hidden>*</span>}
      </label>
      {children}
      {message ? (
        <p id={`${name}-error`} role="alert" className="mt-1 text-xs text-danger">
          {message}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="mt-1 text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input min-h-24 resize-y", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("input appearance-none bg-no-repeat pr-9", className)} style={selectArrow} {...rest}>
      {children}
    </select>
  );
}

const selectArrow = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23a3acc9' stroke-width='2' viewBox='0 0 24 24'><path d='m6 9 6 6 6-6'/></svg>\")",
  backgroundPosition: "right 0.6rem center",
};
