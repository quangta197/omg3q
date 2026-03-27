"use client";

import { useId, useRef, useState } from "react";
import styles from "./SearchableSelect.module.css";

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
};

type SearchableSelectProps = {
  name: string;
  options: SearchableSelectOption[];
  defaultValue?: string;
  placeholder: string;
  emptyLabel?: string;
  noResultsText?: string;
  ariaLabel?: string;
  id?: string;
  inputClassName?: string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getSearchText(option: SearchableSelectOption) {
  return [option.label, option.description, ...(option.keywords ?? [])]
    .filter(Boolean)
    .join(" ");
}

export function SearchableSelect({
  name,
  options,
  defaultValue,
  placeholder,
  emptyLabel,
  noResultsText = "Không tìm thấy kết quả phù hợp.",
  ariaLabel,
  id,
  inputClassName,
}: SearchableSelectProps) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = id ?? `${name}-${generatedId}`;
  const listboxId = `${inputId}-listbox`;
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const initialOption = options.find((option) => option.value === defaultValue);
  const [query, setQuery] = useState(initialOption?.label ?? "");
  const [selectedValue, setSelectedValue] = useState(defaultValue ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedQuery = normalizeText(query);
  const filteredOptions = options
    .filter((option) => {
      if (!normalizedQuery) {
        return true;
      }

      return normalizeText(getSearchText(option)).includes(normalizedQuery);
    })
    .slice(0, 40);

  function findOptionByValue(value: string) {
    return options.find((option) => option.value === value);
  }

  function selectOption(option: SearchableSelectOption) {
    setSelectedValue(option.value);
    setQuery(option.label);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = option.value;
    }
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function clearSelection() {
    setSelectedValue("");
    setQuery("");
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
    }
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function commitQuery() {
    const normalized = normalizeText(query);

    if (!normalized) {
      if (emptyLabel !== undefined) {
        clearSelection();
        return;
      }

      const currentOption = findOptionByValue(selectedValue);
      setQuery(currentOption?.label ?? "");
      return;
    }

    const exactMatch = options.find((option) => {
      const matchesLabel = normalizeText(option.label) === normalized;
      const matchesKeyword = (option.keywords ?? []).some(
        (keyword) => normalizeText(keyword) === normalized
      );

      return matchesLabel || matchesKeyword;
    });

    if (exactMatch) {
      selectOption(exactMatch);
      return;
    }

    const currentOption = findOptionByValue(selectedValue);

    if (currentOption) {
      setQuery(currentOption.label);
      return;
    }

    if (emptyLabel !== undefined) {
      clearSelection();
      return;
    }

    setQuery("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const optionOffset = emptyLabel !== undefined ? 1 : 0;
    const itemCount = filteredOptions.length + optionOffset;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) => {
        if (itemCount === 0) {
          return -1;
        }

        return Math.min(itemCount - 1, currentIndex + 1);
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) => Math.max(0, currentIndex - 1));
      return;
    }

    if (event.key === "Escape") {
      commitQuery();
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    if (!isOpen) {
      const form = event.currentTarget.form;
      event.preventDefault();
      commitQuery();
      window.setTimeout(() => {
        form?.requestSubmit();
      }, 0);
      return;
    }

    event.preventDefault();

    if (emptyLabel !== undefined && activeIndex === 0) {
      clearSelection();
      return;
    }

    const nextOption = filteredOptions[(emptyLabel !== undefined ? activeIndex - 1 : activeIndex)];

    if (nextOption) {
      selectOption(nextOption);
      return;
    }

    if (filteredOptions[0]) {
      selectOption(filteredOptions[0]);
      return;
    }

    commitQuery();
  }

  return (
    <div className={styles.root}>
      <input ref={hiddenInputRef} type="hidden" name={name} value={selectedValue} readOnly />

      <div className={styles.control}>
        <input
          id={inputId}
          type="text"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          role="combobox"
          className={[styles.input, inputClassName].filter(Boolean).join(" ")}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;
            setQuery(nextValue);
            setIsOpen(true);
            setActiveIndex(-1);

            const currentOption = findOptionByValue(selectedValue);

            if (!currentOption || nextValue !== currentOption.label) {
              setSelectedValue("");
              if (hiddenInputRef.current) {
                hiddenInputRef.current.value = "";
              }
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            window.setTimeout(() => {
              if (document.activeElement?.id === inputId) {
                return;
              }

              commitQuery();
              setIsOpen(false);
              setActiveIndex(-1);
            }, 0);
          }}
        />

        <div className={styles.trailing}>
          {query ? (
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Xóa lựa chọn"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clearSelection}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M6 6L14 14M14 6L6 14"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          ) : null}

          <span className={styles.chevron} aria-hidden="true">
            <svg viewBox="0 0 20 20">
              <path
                d="M5.5 7.5L10 12L14.5 7.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
        </div>
      </div>

      {isOpen ? (
        <div className={styles.panel} id={listboxId} role="listbox">
          {emptyLabel !== undefined ? (
            <button
              type="button"
              className={[
                styles.option,
                styles.optionSecondary,
                activeIndex === 0 ? styles.optionActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseDown={(event) => event.preventDefault()}
              onClick={clearSelection}
            >
              <span>{emptyLabel}</span>
            </button>
          ) : null}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const optionIndex = emptyLabel !== undefined ? index + 1 : index;
              const isSelected = option.value === selectedValue;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    styles.option,
                    optionIndex === activeIndex ? styles.optionActive : "",
                    isSelected ? styles.optionSelected : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  <span className={styles.optionLabel}>{option.label}</span>
                  {option.description ? (
                    <span className={styles.optionDescription}>{option.description}</span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className={styles.emptyState}>{noResultsText}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
