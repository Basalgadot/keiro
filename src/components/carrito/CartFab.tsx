"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart, cartCount } from "@/lib/cart";

export default function CartFab() {
  const { items } = useCart();
  const count = cartCount(items);

  if (count === 0) return null;

  return (
    <Link
      href="/carrito"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-green-600 px-4 py-3 text-white shadow-lg hover:bg-green-700 transition-colors"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-sm font-semibold">
        Ver carrito · {count} {count === 1 ? "ítem" : "ítems"}
      </span>
    </Link>
  );
}
