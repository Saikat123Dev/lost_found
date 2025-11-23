// Home page functionality

// Load statistics
async function loadStats() {
  try {
    const response = await apiRequest('/items/stats/summary');
    if (response.success) {
      document.getElementById('totalFound').textContent = response.data.totalFound || 0;
      document.getElementById('totalLost').textContent = response.data.totalLost || 0;
      document.getElementById('totalReturned').textContent = response.data.totalReturned || 0;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load leaderboard
async function loadLeaderboard() {
  try {
    const response = await apiRequest('/users');
    if (response.success && response.data) {
      const leaderboardList = document.getElementById('leaderboardList');
      if (!leaderboardList) return;

      leaderboardList.innerHTML = '';

      if (response.data.length === 0) {
        leaderboardList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">No contributors yet. Be the first!</p>';
        return;
      }

      response.data.slice(0, 5).forEach((user, index) => {
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
                    <div class="leaderboard-rank">${rankEmoji}</div>
                    <div class="leaderboard-user">
                        <div class="leaderboard-username">${user.username}</div>
                        <div class="leaderboard-stats">
                            Level ${user.level} • ${user.itemsReported} reports • ${user.itemsReturned} returns
                        </div>
                    </div>
                    <div class="leaderboard-points">${user.points} pts</div>
                `;
        leaderboardList.appendChild(item);
      });
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

// Load recent activity
async function loadRecentActivity() {
  try {
    const response = await apiRequest('/items?type=found&status=active');
    if (response.success && response.data) {
      const activityList = document.getElementById('recentActivity');
      if (!activityList) return;

      activityList.innerHTML = '';

      if (response.data.length === 0) {
        activityList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No recent reports</p>';
        return;
      }

      response.data.slice(0, 5).forEach(item => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
                    <div><strong>${item.submittedBy}</strong> reported a <strong>${item.itemName}</strong></div>
                    <div class="activity-time">${timeAgo(item.createdAt)} • ${item.location.floor}</div>
                `;
        activityList.appendChild(activityItem);
      });
    }
  } catch (error) {
    console.error('Error loading recent activity:', error);
  }
}

// Toggle leaderboard (placeholder for future expansion)
function toggleLeaderboard() {
  showNotification('Full leaderboard coming soon!', 'success');
}

// Initialize home page
document.addEventListener('DOMContentLoaded', () => {
  initUserSession();
  loadStats();
  loadLeaderboard();
  loadRecentActivity();

  // Refresh stats every 30 seconds
  setInterval(() => {
    loadStats();
    loadRecentActivity();
  }, 30000);
});
