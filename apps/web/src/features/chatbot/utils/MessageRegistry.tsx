/**
 * Message Registry for managing DOM references and scroll-to-message behavior
 * Allows clicking a reply label to scroll to the original question
 */

// Simple singleton registry to store message element references
const messageRegistry = new Map<string, HTMLElement | null>();

/**
 * Register a message element in the registry
 * Call this from a useEffect with cleanup
 */
export function registerMessageElement(id: string, el: HTMLElement | null) {
  if (!id) return;
  if (el) {
    messageRegistry.set(id, el);
    console.log('✅ Registered message:', id, el);
  } else {
    // cleanup on unmount
    messageRegistry.delete(id);
    console.log('🗑️ Unregistered message:', id);
  }
}

/**
 * Scroll to a registered message element by ID
 * Optionally highlights the element briefly
 */
export function scrollToMessage(id: string) {
  console.log('📜 Attempting to scroll to:', id);
  console.log('📋 Registry has:', Array.from(messageRegistry.keys()));
  
  const el = messageRegistry.get(id);
  if (!el) {
    console.warn(`❌ Message element not found for id: ${id}`);
    return;
  }
  
  console.log('✅ Found element, scrolling:', el);
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Add highlight effect
  el.classList.add('puzzle-chat-highlight');
  window.setTimeout(() => el.classList.remove('puzzle-chat-highlight'), 1200);
}

/**
 * Clear all registered message elements
 * Useful for cleanup when unmounting the chatbot
 */
export function clearMessageRegistry() {
  messageRegistry.clear();
}
