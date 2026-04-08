"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AccountSort } from "@/lib/types";

type HomeSortControlProps = {
  value: AccountSort;
  className?: string;
  selectClassName?: string;
};

export function HomeSortControl({
  value,
  className,
  selectClassName,
}: HomeSortControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextValue = event.currentTarget.value as AccountSort;
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", nextValue);
    }

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  return (
    <div className={className}>
      <span>Sắp xếp:</span>
      <select
        value={value}
        onChange={handleChange}
        className={selectClassName}
        aria-label="Sắp xếp tài khoản nổi bật"
        disabled={isPending}
      >
        <option value="newest">Mới nhất</option>
        <option value="price_asc">Giá tăng dần</option>
        <option value="price_desc">Giá giảm dần</option>
      </select>
    </div>
  );
}
