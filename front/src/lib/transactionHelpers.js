export const isExpense = (transaction) => {
  return transaction?.type === 'EXPENSE';
};

export const isIncome = (transaction) => {
  return transaction?.type === 'INCOME';
};

export const getSignedAmount = (transaction) => {
  if (!transaction || !transaction.amount) return 0;

  const val = Math.abs(parseFloat(transaction.amount));
  return isExpense(transaction) ? -val : val;
};
