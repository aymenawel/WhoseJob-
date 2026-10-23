"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/locale";
import { suggestAddresses, type AddressSuggestion } from "@/lib/geo/vgin";
import styles from "./AddressSearch.module.css";

const DEBOUNCE_MS = 200;

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onPick: (s: AddressSuggestion) => void;
  className?: string;
  /** Injected in tests; the app uses Virginia's statewide locator. */
  suggest?: (text: string, opts: { signal?: AbortSignal }) => Promise<AddressSuggestion[]>;
};

/**
 * An address box that suggests real addresses as you type (WAI-ARIA combobox):
 * arrows move, Enter or a tap picks, Escape closes. Enter with nothing
 * highlighted is left to the surrounding form, so a full address still searches.
 */
export function AddressSearch({ id, label, value, onChange, onPick, className, suggest = suggestAddresses }: Props) {
  const { t } = useLocale();
  const [options, setOptions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlight = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      inFlight.current?.abort();
    },
    [],
  );

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function lookUp(text: string) {
    inFlight.current?.abort();
    const ctrl = new AbortController();
    inFlight.current = ctrl;
    suggest(text, { signal: ctrl.signal }).then(
      (found) => {
        if (ctrl.signal.aborted) return; // a newer keystroke owns the list
        setOptions(found);
        setActive(-1);
        setOpen(found.length > 0);
      },
      // No suggestions is fine: the Find button still searches the old way.
      () => !ctrl.signal.aborted && close(),
    );
  }

  function pick(s: AddressSuggestion) {
    clearTimeout(timer.current);
    inFlight.current?.abort();
    close();
    onPick(s);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(options[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-opt-${i}`;

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        value={value}
        placeholder={label}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        autoComplete="off"
        enterKeyHint="search"
        onChange={(e) => {
          onChange(e.target.value);
          clearTimeout(timer.current);
          const text = e.target.value;
          timer.current = setTimeout(() => lookUp(text), DEBOUNCE_MS);
        }}
        onKeyDown={onKeyDown}
        onBlur={close}
      />
      <ul id={listId} role="listbox" aria-label={t("where.suggestions")} className={styles.list} hidden={!open}>
        {options.map((s, i) => {
          const comma = s.label.indexOf(",");
          const street = comma > 0 ? s.label.slice(0, comma) : s.label;
          const place = comma > 0 ? s.label.slice(comma + 2) : "";
          return (
            <li
              key={s.magicKey}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              className={styles.option}
              // Keep focus in the box so the tap lands before blur closes the list.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
            >
              <span className={styles.street}>{street}</span>
              {place && (
                <>
                  <span className="sr-only">, </span>
                  <span className={styles.place}>{place}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className="sr-only" role="status" aria-live="polite">
        {open ? t("where.suggestionCount", { n: String(options.length) }) : ""}
      </p>
    </div>
  );
}
