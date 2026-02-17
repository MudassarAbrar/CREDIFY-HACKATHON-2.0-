/**
 * Credit System Service
 * Handles credit calculations based on user type and task complexity
 */

const RATE_MULTIPLIERS = {
  student: {
    earn: 1.2,  // Students earn 20% more credits
    spend: 0.8  // Students spend 20% less credits
  },
  professional: {
    earn: 1.0,  // Standard rate
    spend: 1.0  // Standard rate
  }
};

const COMPLEXITY_MULTIPLIERS = {
  simple: 0.8,
  moderate: 1.0,
  complex: 1.5
};

/**
 * Calculate credits earned for teaching
 * @param {number} baseRate - Base rate per hour
 * @param {number} duration - Duration in hours
 * @param {string} userType - 'student' or 'professional'
 * @param {string} complexity - 'simple', 'moderate', or 'complex'
 * @returns {number} Credits earned
 */
export const calculateEarnedCredits = (baseRate, duration, userType, complexity = 'moderate') => {
  const userMultiplier = RATE_MULTIPLIERS[userType]?.earn || 1.0;
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[complexity] || 1.0;
  
  return Math.round((baseRate * duration * userMultiplier * complexityMultiplier) * 100) / 100;
};

/**
 * Calculate credits spent for learning
 * @param {number} baseRate - Base rate per hour
 * @param {number} duration - Duration in hours
 * @param {string} userType - 'student' or 'professional'
 * @param {string} complexity - 'simple', 'moderate', or 'complex'
 * @returns {number} Credits spent
 */
export const calculateSpentCredits = (baseRate, duration, userType, complexity = 'moderate') => {
  const userMultiplier = RATE_MULTIPLIERS[userType]?.spend || 1.0;
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[complexity] || 1.0;
  
  return Math.round((baseRate * duration * userMultiplier * complexityMultiplier) * 100) / 100;
};

/**
 * Check if user has sufficient credits
 * @param {number} currentBalance - Current credit balance
 * @param {number} requiredCredits - Credits required
 * @returns {boolean} True if sufficient, false otherwise
 */
export const hasSufficientCredits = (currentBalance, requiredCredits) => {
  return currentBalance >= requiredCredits;
};
