export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const isValidId = (id: string): boolean => {
  return typeof id === 'string' && id.length > 0;
};
