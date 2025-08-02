export const sanitizeText = (text: string): string => {
  if (typeof text !== 'string' || text == null) {
    return '';
  }
  const element = document.createElement('div');
  element.innerText = text;
  return element.innerHTML;
};