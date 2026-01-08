export const getSentimentScore = (content: string) => {
  if (content.length > 50) {
    return Math.random() * 2 - 1; // random number between -1 and 1
  } else {
    return 0;
  }
};
