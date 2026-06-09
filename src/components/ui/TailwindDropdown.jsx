import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function TailwindDropdown({
  buttonClassName = "",
  disabled = false,
  error = false,
  onChange,
  options,
  placeholder,
  value,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState(null);
  const buttonRef = useRef(null);
  const popupRef = useRef(null);
  const selectedOption = options.find((option) => String(option.value) === String(value));
  const displayLabel = selectedOption?.label || placeholder;

  const updatePopupPosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (!rect) return;

    const gap = 6;
    const viewportPadding = 12;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(160, Math.min(288, openUp ? spaceAbove - gap : spaceBelow - gap));

    setPopupStyle({
      left: Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - viewportPadding - rect.width)),
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
      width: Math.min(Math.max(rect.width, 320), window.innerWidth - viewportPadding * 2),
      maxHeight,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    updatePopupPosition();

    const handleOutsideClick = (event) => {
      if (buttonRef.current?.contains(event.target)) return;
      if (popupRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };

    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, updatePopupPosition]);

  const toggleOpen = () => {
    if (disabled) return;

    updatePopupPosition();
    setIsOpen((current) => !current);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`tailwind-dropdown-button flex min-h-[42px] w-full items-center justify-between gap-3 rounded-2xl bg-white px-3.5 py-2 text-left text-sm transition app-dark:bg-slate-900 ${
          error
            ? "text-red-900 ring-4 ring-red-100 app-dark:text-red-100 app-dark:ring-red-950"
            : "text-slate-800 hover:bg-slate-50 focus:bg-white focus:outline-none app-dark:text-slate-100 app-dark:hover:bg-slate-800"
        } ${disabled ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-80 app-dark:bg-slate-800" : ""} ${buttonClassName}`}
        disabled={disabled}
        onClick={toggleOpen}
      >
        <span className={`tailwind-dropdown-label min-w-0 truncate leading-5 ${selectedOption ? "" : "text-slate-400"}`}>
          {displayLabel}
        </span>
        <svg
          className={`h-4 w-4 flex-none text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen &&
        !disabled &&
        popupStyle &&
        createPortal(
          <div
            ref={popupRef}
            className="tailwind-dropdown-menu fixed z-[2000] max-h-64 overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl ring-1 ring-black/5 app-dark:border-slate-700 app-dark:bg-slate-900"
            style={{
              left: popupStyle.left,
              top: popupStyle.top,
              bottom: popupStyle.bottom,
              width: popupStyle.width,
              maxHeight: popupStyle.maxHeight,
            }}
          >
            {options.map((option) => {
              const selected = String(option.value) === String(value);

              return (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  className={`tailwind-dropdown-item flex w-full min-w-max items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? "tailwind-dropdown-item-selected bg-sky-50 font-semibold text-sky-700 app-dark:bg-sky-950 app-dark:text-sky-200"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 app-dark:text-slate-100 app-dark:hover:bg-slate-800 app-dark:hover:text-white"
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="whitespace-nowrap leading-5">{option.label}</span>
                  {selected && (
                    <svg
                      className="h-4 w-4 flex-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
