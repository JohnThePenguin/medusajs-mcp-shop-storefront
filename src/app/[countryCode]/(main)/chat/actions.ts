"use server"

import { getOrSetCart } from "@lib/data/cart"
import { getCartId, getCacheTag } from "@lib/data/cookies"
import { revalidateTag } from "next/cache"
import { revalidatePath } from "next/cache"

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

export async function refreshCart() {
  try {
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    // Also revalidate the cart path to update the UI
    revalidatePath("/[countryCode]/cart", "page")

    return { success: true }
  } catch (error) {
    console.error("Failed to refresh cart:", error)
    return { success: false }
  }
}
