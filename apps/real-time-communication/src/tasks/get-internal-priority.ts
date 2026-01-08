export const getInternalPriority = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  if (title.length + description.length < 50) {
    return 50;
  }
  return Math.floor(Math.random() * 100);
};
