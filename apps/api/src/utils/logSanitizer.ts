export const sanitizeLog = (logMessage: string): string => {
  return logMessage.replace(/[\n\r\t]/g, " ");
};
