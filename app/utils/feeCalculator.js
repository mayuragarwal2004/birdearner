/**
 * Calculate the bird fee based on the budget amount and fee structure
 * @param {number} budget - The budget amount for the job
 * @param {Object} birdFee - The bird fee structure object containing fee rules
 * @param {number} birdFee.minimumBudget - Minimum allowed budget
 * @param {number} birdFee.maximumBudget - Maximum allowed budget
 * @param {Array} birdFee.feeStructure - Array of fee rules
 * @returns {Object} Object containing fee amount and rule details
 */
export const calculateBirdFee = (budget, birdFee) => {
  // If no fee structure exists, return valid response with zero fee
  if (!birdFee || !birdFee.feeStructure) {
    return {
      feeAmount: 0,
      applicableRule: null,
      isValid: true,
      error: null,
      displayText: 'No service fee'
    };
  }

  // Interpret a maximumBudget of 0 as no upper bound.
  const minBudget = birdFee.minimumBudget != null ? birdFee.minimumBudget : 0;
  const maxBudget = birdFee.maximumBudget > 0 ? birdFee.maximumBudget : Infinity;

  if (budget < minBudget || budget > maxBudget) {
    const errorText =
      maxBudget === Infinity
        ? `Budget must be at least ₹${minBudget}`
        : minBudget === 0
        ? `Budget must be ₹${maxBudget} or less`
        : `Budget must be between ₹${minBudget} and ₹${maxBudget}`;

    return {
      feeAmount: 0,
      applicableRule: null,
      isValid: false,
      error: errorText
    };
  }

  // Find the applicable fee rule
  // Interpret bracket maxAmount <= 0 as no upper bound and minAmount undefined as 0
  let applicableRule = null;
  for (const rule of birdFee.feeStructure) {
    const min = rule.minAmount != null ? rule.minAmount : 0;
    const max = rule.maxAmount > 0 ? rule.maxAmount : Infinity;
    if (budget >= min && budget <= max) {
      applicableRule = rule;
      break;
    }
  }

  // If no rule matched, fallback to the last bracket (consistent with server behavior)
  if (!applicableRule && birdFee.feeStructure.length > 0) {
    const last = birdFee.feeStructure[birdFee.feeStructure.length - 1];
    applicableRule = last;
  }

  // If still no rule, return zero fee
  if (!applicableRule || !applicableRule.feeType) {
    return {
      feeAmount: 0,
      applicableRule: null,
      isValid: true,
      error: null,
      displayText: 'No service fee'
    };
  }

  // Calculate fee based on type
  let feeAmount = 0;
  if (applicableRule.feeType === 'FIXED') {
    feeAmount = applicableRule.feeValue;
  } else if (applicableRule.feeType === 'PERCENTAGE') {
    feeAmount = (budget * applicableRule.feeValue) / 100;
  }

  return {
    feeAmount,
    applicableRule,
    isValid: true,
    error: null,
    displayText: applicableRule.feeType === 'FIXED' 
      ? `Fixed fee of ₹${feeAmount}`
      : `${applicableRule.feeValue}% (₹${feeAmount.toFixed(2)})`
  };
};

/**
 * Format the bird fee as a display string
 * @param {number} feeAmount - The calculated fee amount
 * @param {Object} applicableRule - The rule that was applied
 * @returns {string} Formatted string for display
 */
export const formatBirdFeeDisplay = (feeAmount, applicableRule) => {
  if (!applicableRule) return '';
  
  return applicableRule.feeType === 'FIXED'
    ? `Fixed fee of ₹${feeAmount}`
    : `${applicableRule.feeValue}% (₹${feeAmount.toFixed(2)})`;
};