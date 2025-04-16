// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiryTime;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
};

// Get remaining token time in minutes
export const getTokenRemainingTime = (token) => {
  if (!token) return 0;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const remainingTime = expiryTime - Date.now();
    return Math.max(0, Math.floor(remainingTime / (1000 * 60))); // Convert to minutes
  } catch (error) {
    console.error('Error getting token remaining time:', error);
    return 0;
  }
};

// Store user data in local storage
export const storeUserData = (userData, token) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
};

// Clear user data from local storage
export const clearUserData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get stored user data
export const getStoredUserData = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing stored user data:', error);
    return null;
  }
};