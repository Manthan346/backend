export const formatDateTime = (dateTime) => {
  const d = new Date(dateTime);
  return d.toLocaleString();
};
