export const sanitizeText = (text: string): string => {
  if (typeof text !== "string" || text == null) {
    return "";
  }

  // Create element inside function to avoid SSR issues
  if (typeof document === "undefined") {
    // Fallback for SSR environments
    return String(text).replace(/[<>&"']/g, (match) => {
      const escapeMap: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#x27;",
      };
      return escapeMap[match] || match;
    });
  }

  const sanitizationElement = document.createElement("div");
  sanitizationElement.innerText = text;
  return sanitizationElement.innerHTML;
};
