"use client";

import { useEffect, useRef } from "react";

/** Son va raqam formada matn ko‘rinishida: "3", "12" */
export type IssueValues = { issueNo: string; issueSeq: string };

/** Faqat 1–999: boshqa belgilar va boshidagi nollar tushib qoladi */
const digits = (v: string) => v.replace(/\D/g, "").replace(/^0+/, "").slice(0, 3);

/**
 * "[3]-son, [12]-maqola" — o‘qituvchi yuborishda, moderator va admin chop etishda. Maydon bo‘sh qoldirilsa,
 * oxirgi qiymat qaytadi: joy hech qachon chala yuborilmaydi
 */
export function IssueFields({
  value,
  onChange,
  invalid = false,
  describedBy,
}: {
  value: IssueValues;
  onChange: (next: IssueValues) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const last = useRef(value);
  // Tashqaridan qo‘yilgan qiymat ham (masalan, "Bo‘sh: …" taklifi) oxirgi to‘g‘ri qiymat bo‘ladi
  useEffect(() => {
    last.current = { issueNo: value.issueNo || last.current.issueNo, issueSeq: value.issueSeq || last.current.issueSeq };
  }, [value.issueNo, value.issueSeq]);

  const input = (key: keyof IssueValues, label: string) => (
    <input
      name={key}
      aria-label={label}
      inputMode="numeric"
      autoComplete="off"
      maxLength={3}
      value={value[key]}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(e) => onChange({ ...value, [key]: digits(e.target.value) })}
      onBlur={() => !value[key] && onChange({ ...value, [key]: last.current[key] })}
      className="input w-16 px-2 text-center tabular-nums"
    />
  );

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {input("issueNo", "Son")}-son, {input("issueSeq", "Maqola raqami")}-maqola
    </span>
  );
}
