"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import styles from "./ProductNavLink.module.css";

type ProductNavLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
  children: ReactNode;
  pendingLabel?: string;
};

function pathFromHref(href: ComponentProps<typeof Link>["href"]) {
  if (typeof href === "string") {
    return href.split(/[?#]/)[0] || "/";
  }

  if (typeof href.pathname === "string") {
    return href.pathname;
  }

  return null;
}

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    (!event.currentTarget.target || event.currentTarget.target === "_self")
  );
}

function PendingCue({ optimisticPending, label }: { optimisticPending: boolean; label: string }) {
  const { pending } = useLinkStatus();
  const visible = optimisticPending || pending;

  return (
    <>
      <span className={styles.pendingCue} data-pending={visible ? "true" : "false"} aria-hidden="true">
        <span className={styles.pendingDot} />
      </span>
      <span className={styles.srOnly} aria-live="polite">
        {visible ? label : ""}
      </span>
    </>
  );
}

export function ProductNavLink({
  children,
  className,
  href,
  onClick,
  pendingLabel = "Abrindo",
  ...props
}: ProductNavLinkProps) {
  const pathname = usePathname();
  const [optimisticPending, setOptimisticPending] = useState(false);
  const targetPath = pathFromHref(href);

  useEffect(() => {
    setOptimisticPending(false);
  }, [pathname]);

  useEffect(() => {
    if (!optimisticPending) return;
    const timeout = window.setTimeout(() => setOptimisticPending(false), 8000);
    return () => window.clearTimeout(timeout);
  }, [optimisticPending]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || !isPlainLeftClick(event)) return;
    if (targetPath && targetPath !== pathname) {
      setOptimisticPending(true);
    }
  }

  const linkClassName = [className, optimisticPending ? styles.pendingLink : ""].filter(Boolean).join(" ");

  return (
    <Link {...props} className={linkClassName || undefined} href={href} onClick={handleClick}>
      {children}
      <PendingCue optimisticPending={optimisticPending} label={pendingLabel} />
    </Link>
  );
}
