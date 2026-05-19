import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchableSelect({ 
  value, 
  onValueChange, 
  options = [], 
  placeholder = "Selecione...",
  allowNone = false,
  noneLabel = "Nenhum",
  className
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption?.label || (allowNone && !value ? noneLabel : "");

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (val) => {
    onValueChange(val);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !displayLabel && !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {displayLabel || placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 opacity-50 shrink-0 ml-2 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="h-8 pl-8 pr-8 text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {allowNone && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                  !value && "bg-accent font-medium"
                )}
              >
                {noneLabel}
              </button>
            )}
            {filtered.length > 0 ? (
              filtered.map(option => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                    value === option.value && "bg-accent font-medium"
                  )}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}