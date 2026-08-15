/**
 * LeetProvider.tsx
 *
 * DOM-based 1337 transform scoped to the primary app content.
 * Keeps overlay and input UI untouched.
 */

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useEasterEggStore } from '@/store/easterEggStore'

const LEET_MAP: Record<string, string> = {
    a: '4',
    A: '4',
    e: '3',
    E: '3',
    i: '1',
    I: '1',
    o: '0',
    O: '0',
    s: '5',
    S: '5',
    t: '7',
    T: '7',
    b: '8',
    B: '8',
    g: '6',
    G: '6',
    l: '1',
    L: '1',
}

const EXCLUDED_SELECTOR = [
    '[data-no-leet]',
    'input',
    'textarea',
    'select',
    'code',
    'pre',
    'script',
    'style',
    '[contenteditable="true"]',
].join(', ')

function toLeet(text: string): string {
    return text.replace(/[aAeEiIoOsStTbBgGlL]/g, (char) => LEET_MAP[char] ?? char)
}

function collectTextNodes(node: Node, callback: (textNode: Text) => void) {
    if (node.nodeType === Node.TEXT_NODE) {
        callback(node as Text)
        return
    }

    if (!(node instanceof Element) && !(node instanceof DocumentFragment)) {
        return
    }

    node.childNodes.forEach((child) => collectTextNodes(child, callback))
}

export function LeetProvider({ children }: { children: ReactNode }) {
    const { leetMode } = useEasterEggStore()
    const originalTextRef = useRef(new Map<Text, string>())
    const observerRef = useRef<MutationObserver | null>(null)
    const isApplyingRef = useRef(false)

    useEffect(() => {
        const root = document.querySelector<HTMLElement>('[data-easter-content]')
        if (!root) return

        const shouldSkipNode = (textNode: Text) => {
            const parent = textNode.parentElement
            if (!parent) return true
            if (!textNode.textContent?.trim()) return true
            return Boolean(parent.closest(EXCLUDED_SELECTOR))
        }

        const applyToTextNode = (textNode: Text) => {
            if (shouldSkipNode(textNode)) return

            const originalText = textNode.textContent ?? ''
            originalTextRef.current.set(textNode, originalText)
            textNode.textContent = toLeet(originalText)
        }

        const restoreAll = () => {
            isApplyingRef.current = true
            originalTextRef.current.forEach((originalText, textNode) => {
                if (textNode.isConnected) {
                    textNode.textContent = originalText
                }
            })
            originalTextRef.current.clear()
            isApplyingRef.current = false
        }

        if (!leetMode) {
            observerRef.current?.disconnect()
            observerRef.current = null
            restoreAll()
            return
        }

        isApplyingRef.current = true
        collectTextNodes(root, applyToTextNode)
        isApplyingRef.current = false

        const observer = new MutationObserver((mutations) => {
            if (isApplyingRef.current) return

            isApplyingRef.current = true

            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData' && mutation.target instanceof Text) {
                    applyToTextNode(mutation.target)
                    return
                }

                mutation.addedNodes.forEach((node) => {
                    collectTextNodes(node, applyToTextNode)
                })
            })

            isApplyingRef.current = false
        })

        observer.observe(root, {
            childList: true,
            subtree: true,
            characterData: true,
        })
        observerRef.current = observer

        return () => {
            observer.disconnect()
            observerRef.current = null
            restoreAll()
        }
    }, [leetMode])

    return <>{children}</>
}

export default LeetProvider
