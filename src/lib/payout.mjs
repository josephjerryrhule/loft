export function selectCommissionIdsForPayout(payoutAmount, approvedCommissions) {
  let remainingAmount = Number(payoutAmount) || 0;
  const selected = [];

  for (const commission of approvedCommissions) {
    if (remainingAmount <= 0) break;

    const amount = Number(commission.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    if (amount <= remainingAmount) {
      selected.push(commission.id);
      remainingAmount -= amount;
    }
  }

  return selected;
}

