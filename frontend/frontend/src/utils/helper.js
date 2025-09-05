export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
