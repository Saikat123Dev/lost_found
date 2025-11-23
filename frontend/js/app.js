// API Configuration
const API_BASE_URL = 'https://lost-found-5vwh.onrender.com/api';

// Local Storage Keys
const STORAGE_KEYS = {
  USERNAME: 'lf_username',
  USER_DATA: 'lf_user_data'
};

// Get username from localStorage
function getUsername() {
  return localStorage.getItem(STORAGE_KEYS.USERNAME) || null;
}

// Set username in localStorage
function setUsernameStorage(username) {
  localStorage.setItem(STORAGE_KEYS.USERNAME, username);
}

// Get user data from localStorage
function getUserData() {
  const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  return data ? JSON.parse(data) : null;
}

// Save user data to localStorage
function saveUserData(userData) {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format time for display
function formatTime(timeString) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Calculate time ago
function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Award points to user
async function awardPoints(points, action) {
  const username = getUsername();
  if (!username) return;

  try {
    const response = await apiRequest(`/users/${username}/points`, {
      method: 'POST',
      body: JSON.stringify({ points, action })
    });

    if (response.success) {
      saveUserData(response.data);

      // Show badge notification if any new badges earned
      if (response.newBadges && response.newBadges.length > 0) {
        response.newBadges.forEach(badge => {
          showNotification(`🎉 New badge earned: ${badge.icon} ${badge.name}!`, 'success');
        });
      }

      return response.data;
    }
  } catch (error) {
    console.error('Error awarding points:', error);
  }
}

// Create or get user
async function initUser(username) {
  try {
    const response = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({ username })
    });

    if (response.success) {
      setUsernameStorage(username);
      saveUserData(response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error initializing user:', error);
    throw error;
  }
}

// Update user stats display
function updateUserStatsDisplay(userData) {
  const levelEl = document.getElementById('userLevel');
  const pointsEl = document.getElementById('userPoints');
  const badgesEl = document.getElementById('userBadges');

  if (levelEl) levelEl.textContent = userData.level || 1;
  if (pointsEl) pointsEl.textContent = userData.points || 0;

  if (badgesEl && userData.badges) {
    badgesEl.innerHTML = '';
    userData.badges.slice(0, 5).forEach(badge => {
      const badgeEl = document.createElement('div');
      badgeEl.className = 'badge';
      badgeEl.textContent = badge.icon;
      badgeEl.title = badge.name;
      badgesEl.appendChild(badgeEl);
    });
  }
}

// Load user stats
async function loadUserStats() {
  const username = getUsername();
  if (!username) return null;

  try {
    const response = await apiRequest(`/users/${username}`);
    if (response.success) {
      saveUserData(response.data);
      updateUserStatsDisplay(response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error loading user stats:', error);
  }
  return null;
}

// Initialize user session
function initUserSession() {
  const username = getUsername();
  const userData = getUserData();

  if (!username) {
    // Show username modal
    const modal = document.getElementById('userModal');
    if (modal) {
      modal.classList.add('active');
    }
  } else if (userData) {
    updateUserStatsDisplay(userData);
    loadUserStats(); // Refresh from server
  } else {
    loadUserStats();
  }
}

// Set username from modal
async function setUsername() {
  const input = document.getElementById('usernameInput');
  const username = input.value.trim();

  if (!username) {
    showNotification('Please enter your name', 'error');
    return;
  }

  try {
    await initUser(username);
    const modal = document.getElementById('userModal');
    if (modal) {
      modal.classList.remove('active');
    }
    showNotification(`Welcome, ${username}! 🎉`);
    location.reload();
  } catch (error) {
    showNotification('Error setting username. Please try again.', 'error');
  }
}

// Check if user is logged in
function requireUser() {
  const username = getUsername();
  if (!username) {
    showNotification('Please set your username first', 'error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
  return true;
}
