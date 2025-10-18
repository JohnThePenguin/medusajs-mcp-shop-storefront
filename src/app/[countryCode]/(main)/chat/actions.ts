"use server"

import { getOrSetCart } from "@lib/data/cart"
import { getCartId } from "@lib/data/cookies"

export async function initializeCart(countryCode: string) {
  try {
    await getOrSetCart(countryCode)
    const cartId = await getCartId()
    return { success: true, cartId: cartId || null }
  } catch (error) {
    console.error("Failed to initialize cart:", error)
    return { success: false, cartId: null }
  }
}
