export const sanitizeText = (text: string): string => {
  const element = document.createElement('div');
  element.innerText = text;
  return element.innerHTML;
};