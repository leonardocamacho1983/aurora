export type ProductNavKey = "diario" | "timeline" | "mapa" | "perfil";

export type ProductNavItem = {
  key: ProductNavKey;
  label: string;
  href: string;
};

export const PRODUCT_NAV_ITEMS: ProductNavItem[] = [
  { key: "diario", label: "Diário", href: "/diario" },
  { key: "timeline", label: "Timeline", href: "/timeline" },
  { key: "mapa", label: "Mapa", href: "/mapa" },
  { key: "perfil", label: "Perfil", href: "/account" },
];
