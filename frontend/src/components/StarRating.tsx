import React, { useState } from "react";

/** Estrellas 1–5. Interactivo (onChange) o de solo lectura (readOnly). */
export const StarRating: React.FC<{
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: number;
}> = ({ value, onChange, readOnly = false, size = 22 }) => {
  const [hover, setHover] = useState(0);
  const activo = hover || value;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(n)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          title={`${n}/5`}
        >
          <span
            style={{ fontSize: size, lineHeight: 1 }}
            className={
              n <= activo
                ? "text-amber-400"
                : "text-slate-300 dark:text-slate-600"
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
};
