"use client"

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react"

import { addToCart, refreshCart, removeCartLine, updateCartLine } from "./actions"
import { track } from "@/lib/analytics/track"
import type { CartItem, CartReadState } from "./types"

type AddItemInput = { slug: string }
type CartMutationResult = { items: CartItem[]; error?: string }

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  hasUnpricedItems: boolean
  isPending: boolean
  cartStatus: CartReadState["status"]
  retryCart: () => Promise<void>
  addItem: (input: AddItemInput, qty?: number) => Promise<{ error?: string }>
  updateQty: (lineId: string, qty: number) => Promise<{ error?: string }>
  removeItem: (lineId: string) => Promise<{ error?: string }>
  /** Resets local display state after an order is placed — the Vendure
   * order is already settled server-side by then, this just clears the
   * client-visible cart without another round trip. */
  clearCart: () => void
  /** Syncs local display state after a multi-item server action (reorder)
   * that already resolved the final cart server-side in one round trip —
   * calling addItem() N times would work too, but means N separate
   * requests/re-renders for what's really one batched operation. */
  setItems: (items: CartItem[]) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({
  initialState,
  children,
}: {
  initialState: CartReadState
  children: ReactNode
}) {
  const [items, setItems] = useState<CartItem[]>(initialState.items)
  const [cartStatus, setCartStatus] = useState<CartReadState["status"]>(initialState.status)
  const [transitionPending, startTransition] = useTransition()
  const [mutationPending, setMutationPending] = useState(false)
  const mutationQueue = useRef<Promise<void>>(Promise.resolve())
  const pendingMutations = useRef(0)

  // The layout keys this provider by session and the serialized server cart,
  // so a refresh or login/logout transition remounts it with authoritative
  // data without an effect that can overwrite a newer client mutation.
  function enqueueMutation(mutation: () => Promise<CartMutationResult>): Promise<{ error?: string }> {
    pendingMutations.current += 1
    setMutationPending(true)

    const queued = mutationQueue.current
      .then(async () => {
        const result = await mutation()
        if (!result.error) {
          startTransition(() => {
            setItems(result.items)
            setCartStatus("available")
          })
        } else if (result.error === "network_error") {
          setCartStatus("unavailable")
        }
        return { error: result.error }
      })
      .catch((error: unknown) => {
        setCartStatus("unavailable")
        return { error: error instanceof Error ? error.message : "network_error" }
      })

    const settled = queued.finally(() => {
      pendingMutations.current -= 1
      if (pendingMutations.current === 0) setMutationPending(false)
    })
    mutationQueue.current = settled.then(() => undefined, () => undefined)
    return settled
  }

  function addItem(input: AddItemInput, qty = 1): Promise<{ error?: string }> {
    return enqueueMutation(() => addToCart(input.slug, qty)).then((result) => {
      // F-70: funnel event on SUCCESS only — a rejected add (stock, price)
      // must not look like demand in the analytics.
      if (!result.error) track("add_to_cart", { currency: "EGP", items: [{ item_id: input.slug, quantity: qty }] })
      return result
    })
  }

  function updateQty(lineId: string, qty: number): Promise<{ error?: string }> {
    return enqueueMutation(() => updateCartLine(lineId, qty))
  }

  function removeItem(lineId: string): Promise<{ error?: string }> {
    // F-70: capture the line before mutation so the event can name it.
    const removed = items.find((item) => item.lineId === lineId)
    return enqueueMutation(() => removeCartLine(lineId)).then((result) => {
      if (!result.error && removed) {
        track("remove_from_cart", {
          currency: "EGP",
          items: [{ item_id: removed.slug ?? removed.name, item_name: removed.name, quantity: removed.qty }],
        })
      }
      return result
    })
  }

  async function retryCart(): Promise<void> {
    setMutationPending(true)
    try {
      const result = await refreshCart()
      if (result.status === "available") setItems(result.items)
      setCartStatus(result.status)
    } catch {
      setCartStatus("unavailable")
    } finally {
      setMutationPending(false)
    }
  }

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0)
  const subtotal = items.reduce((sum, item) => sum + (typeof item.price === "number" ? item.price * item.qty : 0), 0)
  const hasUnpricedItems = items.some((item) => typeof item.price !== "number")

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        hasUnpricedItems,
        isPending: transitionPending || mutationPending,
        cartStatus,
        retryCart,
        addItem,
        updateQty,
        removeItem,
        clearCart: () => {
          setItems([])
          setCartStatus("available")
        },
        setItems: (nextItems) => {
          setItems(nextItems)
          setCartStatus("available")
        },
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within a CartProvider")
  return context
}
