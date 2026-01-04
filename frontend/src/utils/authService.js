/**
 * Authentication Service for Local JWT-based Authentication
 * Replaces Firebase authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token storage keys
const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user_profile';

/**
 * Store auth token in localStorage
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Get auth token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove auth token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Store user profile in localStorage
 */
export const setUserProfile = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Get user profile from localStorage
 */
export const getUserProfile = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Register a new user
 */
export const register = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return await response.json();
};

/**
 * Login user
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/accounts/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  const data = await response.json();
  
  // Store the token
  setToken(data.access_token);
  
  // Fetch and store user profile
  const profile = await fetchProfile();
  setUserProfile(profile);
  
  return { token: data.access_token, user: profile };
};

/**
 * Logout user
 */
export const logout = () => {
  removeToken();
};

/**
 * Fetch user profile
 */
export const fetchProfile = async () => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/accounts/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      removeToken();
      throw new Error('Session expired. Please login again.');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch profile');
  }

  return await response.json();
};

/**
 * Update user profile
 */
export const updateProfile = async (userData) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/accounts/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update profile');
  }

  const data = await response.json();
  
  // Update stored profile
  if (data.user) {
    setUserProfile(data.user);
  }
  
  return data;
};

/**
 * Check if email exists
 */
export const checkEmailExists = async (email) => {
  const response = await fetch(`${API_BASE_URL}/accounts/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error('Failed to check email');
  }

  const data = await response.json();
  return data.email_exists;
};

/**
 * Check if phone number exists
 */
export const checkPhoneExists = async (phone_number) => {
  const response = await fetch(`${API_BASE_URL}/accounts/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone_number }),
  });

  if (!response.ok) {
    throw new Error('Failed to check phone number');
  }

  const data = await response.json();
  return data.phone_exists;
};

/**
 * Make authenticated API request
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    // Token expired
    removeToken();
    throw new Error('Session expired. Please login again.');
  }

  return response;
};

export default {
  register,
  login,
  logout,
  fetchProfile,
  updateProfile,
  checkEmailExists,
  checkPhoneExists,
  isAuthenticated,
  getToken,
  setToken,
  removeToken,
  getUserProfile,
  setUserProfile,
  authenticatedFetch,
};
