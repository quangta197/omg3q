"use client";

import { useId, useState } from "react";

type FormattedNumberInputProps = {
  name: string;
  defaultValue?: number | null;
  className?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  ariaLabel?: string;
};

function normalizeDigits(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.replace(/^0+(?=\d)/, "");
}

function formatDigits(value: string) {
  if (!value) {
    return "";
  }

  return Number(value).toLocaleString("vi-VN");
}

export function FormattedNumberInput({
  name,
  defaultValue,
  className,
  id,
  placeholder,
  required,
  ariaLabel,
}: FormattedNumberInputProps) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = id ?? `${name}-${generatedId}`;
  const initialDigits =
    defaultValue === null || defaultValue === undefined
      ? ""
      : normalizeDigits(String(defaultValue));
  const [digits, setDigits] = useState(initialDigits);

  return (
    <>
      <input type="hidden" name={name} value={digits} readOnly />
      <input
        id={inputId}
        className={className}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatDigits(digits)}
        placeholder={placeholder}
        required={required}
        aria-label={ariaLabel}
        onChange={(event) => {
          setDigits(normalizeDigits(event.currentTarget.value));
        }}
      />
    </>
  );
}
