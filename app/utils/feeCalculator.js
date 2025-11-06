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
  if (!birdFee || !birdFee.feeStructure) {
    return {
      feeAmount: 0,
      applicableRule: null,
      isValid: false,
      error: 'Invalid fee structure'
    };
  }

  // Validate budget against min/max constraints
  if (budget < birdFee.minimumBudget || budget > birdFee.maximumBudget) {
    return {
      feeAmount: 0,
      applicableRule: null,
      isValid: false,
      error: `Budget must be between ₹${birdFee.minimumBudget} and ₹${birdFee.maximumBudget}`
    };
  }

  // Find the applicable fee rule
  const applicableRule = birdFee.feeStructure.find(
    rule => budget >= rule.minAmount && budget <= rule.maxAmount
  );

  if (!applicableRule) {
    return {
      feeAmount: 0,
      applicableRule: null,
      isValid: false,
      error: 'No applicable fee rule found for this budget'
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