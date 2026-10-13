"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Select } from "@/components/ui/field";

type Option = { value: string; label: string };

type SearchFiltersProps = {
  placeholder: string;
  filters?: Array<{ name: string; label: string; options: Option[] }>;
  children?: ReactNode;
};

/**
 * Barre de recherche + filtres synchronisés avec l'URL (?q=…&statut=…).
 * Les pages lisent ces paramètres côté serveur.
 */
export function SearchFilters({ placeholder, filters = [], children }: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  const timer = useRef<number | null>(null);

  // Si l'URL change de l'extérieur (ex. bouton « Réinitialiser »), on resynchronise le champ.
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setQ(urlQ);
  }

  const push = (next: URLSearchParams) => {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const onSearch = (value: string) => {
    setQ(value);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      push(next);
    }, 250);
  };

  const onFilter = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    push(next);
  };

  return (
    <div className="card mb-5 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="input pl-9"
        />
        {q && (
          <button
            type="button"
            onClick={() => onSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-fg-subtle hover:text-fg"
            aria-label="Effacer la recherche"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {filters.map((f) => (
        <div key={f.name} className="sm:w-44">
          <label htmlFor={`filter-${f.name}`} className="sr-only">
            {f.label}
          </label>
          <Select id={`filter-${f.name}`} value={params.get(f.name) ?? ""} onChange={(e) => onFilter(f.name, e.target.value)}>
            <option value="">{f.label}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      ))}
      {children}
    </div>
  );
}
