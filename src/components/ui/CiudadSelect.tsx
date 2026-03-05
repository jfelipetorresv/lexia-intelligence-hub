"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

const CIUDADES = [
  "Bogotá D.C.","Medellín","Cali","Barranquilla","Cartagena de Indias",
  "Cúcuta","Bucaramanga","Pereira","Santa Marta","Ibagué","Manizales",
  "Pasto","Montería","Villavicencio","Armenia","Sincelejo","Popayán",
  "Valledupar","Neiva","Riohacha","Tunja","Florencia","Quibdó","Arauca",
  "Yopal","Mocoa","Leticia","San Andrés","Puerto Carreño","Mitú","Inírida",
  "Bello","Itagüí","Envigado","Soledad","Soacha","Palmira","Buenaventura",
  "Barrancabermeja","Floridablanca","Girardot","Duitama","Sogamoso",
  "Zipaquirá","Facatativá","Chía","Mosquera","Fusagasugá","Espinal",
  "Magangué","Lorica","Apartadó","Turbo","Rionegro","Caldas","Sabaneta",
];

interface CiudadSelectProps {
  value: string;
  onChange: (ciudad: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CiudadSelect({
  value,
  onChange,
  placeholder = "Buscar ciudad...",
  disabled = false,
}: CiudadSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = CIUDADES.filter((c) =>
    c.toLowerCase().includes((query || value).toLowerCase())
  );

  const displayValue = open ? query : value;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery(value);
          }}
          className="w-full rounded-sm border border-[#E8E9EA] bg-white px-3 py-2 pr-8 text-sm text-[#060606] placeholder:text-[#8B8C8E] focus:border-[#008080] focus:outline-none focus:ring-1 focus:ring-[#008080] disabled:bg-[#FAFBFC] disabled:text-[#8B8C8E]"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8C8E] hover:text-[#060606]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && !disabled && (
        <ul className="absolute z-50 mt-1 max-h-[200px] w-full overflow-y-auto rounded-sm border border-[#E8E9EA] bg-white py-1 shadow-sm">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[#8B8C8E]">
              Sin resultados
            </li>
          ) : (
            filtered.map((ciudad) => (
              <li
                key={ciudad}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(ciudad);
                  setQuery("");
                  setOpen(false);
                }}
                className={`cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-[#FAFBFC] hover:text-[#008080] ${
                  ciudad === value
                    ? "font-medium text-[#008080]"
                    : "text-[#060606]"
                }`}
              >
                {ciudad}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
