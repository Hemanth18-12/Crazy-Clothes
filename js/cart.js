/**
 * Crazy Cloths - Cart State & Storage Manager (Single Product Flow)
 */

const STORAGE_KEY = 'crazy_cloths_draft_order';

const CartManager = {
  /**
   * Save the current draft state of the custom t-shirt selection and customer details
   * @param {Object} state - The current selections and form values
   */
  saveDraft(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save draft order state to localStorage:', e);
    }
  },

  /**
   * Retrieve the saved draft state if it exists
   * @returns {Object|null}
   */
  getDraft() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to read draft order state from localStorage:', e);
      return null;
    }
  },

  /**
   * Clear the draft state from localStorage. Called after order submission.
   */
  clearDraft() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear draft order state from localStorage:', e);
    }
  }
};
