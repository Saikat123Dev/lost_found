// Item Lost (Search) Page functionality

let allItems = [];
let filteredItems = [];

// Load all found items
async function loadItems() {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const itemsGrid = document.getElementById('itemsGrid');

  loadingState.style.display = 'block';
  emptyState.style.display = 'none';
  itemsGrid.innerHTML = '';

  try {
    const response = await apiRequest('/items?type=found&status=active');

    if (response.success) {
      allItems = response.data;
      filteredItems = [...allItems];
      displayItems(filteredItems);
    }
  } catch (error) {
    console.error('Error loading items:', error);
    showNotification('Failed to load items', 'error');
  } finally {
    loadingState.style.display = 'none';
  }
}

// Display items in grid
function displayItems(items) {
  const itemsGrid = document.getElementById('itemsGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');

  itemsGrid.innerHTML = '';

  if (items.length === 0) {
    emptyState.style.display = 'block';
    resultsCount.textContent = '0 items found';
    return;
  }

  emptyState.style.display = 'none';
  resultsCount.textContent = `${items.length} item${items.length !== 1 ? 's' : ''} found`;

  items.forEach(item => {
    const card = createItemCard(item);
    itemsGrid.appendChild(card);
  });
}

// Create item card element
function createItemCard(item) {
  const card = document.createElement('div');
  card.className = 'item-card fade-in';
  card.onclick = () => showItemDetail(item);

  const imageUrl = item.photos && item.photos.length > 0
    ? `${API_BASE_URL.replace('/api', '')}/uploads/${item.photos[0]}`
    : '';

  const locationText = item.location.room
    ? `Room ${item.location.room}`
    : item.location.specificLocation || 'See details';

  card.innerHTML = `
        ${imageUrl ? `<img src="${imageUrl}" alt="${item.itemName}" class="item-image" onerror="this.style.display='none'">` : '<div class="item-image"></div>'}
        <div class="item-category">${item.category}</div>
        <div class="item-name">${item.itemName}</div>
        <div class="item-info">
            <div class="item-info-row">
                <span>📍</span>
                <span>${item.location.floor} - ${locationText}</span>
            </div>
            <div class="item-info-row">
                <span>📅</span>
                <span>${formatDate(item.date)}</span>
            </div>
            <div class="item-info-row">
                <span>🕐</span>
                <span>${formatTime(item.time)}</span>
            </div>
        </div>
        ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
    `;

  return card;
}

// Show item detail modal
function showItemDetail(item) {
  const modal = document.getElementById('itemModal');
  const content = document.getElementById('itemDetailContent');

  const locationText = item.location.room
    ? `Room ${item.location.room}`
    : item.location.specificLocation || 'Not specified';

  let photosHtml = '';
  if (item.photos && item.photos.length > 0) {
    photosHtml = '<div class="photo-preview">';
    item.photos.forEach(photo => {
      const photoUrl = `${API_BASE_URL.replace('/api', '')}/uploads/${photo}`;
      photosHtml += `
                <div class="preview-item">
                    <img src="${photoUrl}" alt="${item.itemName}" onclick="window.open('${photoUrl}', '_blank')">
                </div>
            `;
    });
    photosHtml += '</div>';
  }

  content.innerHTML = `
        <h2>${item.itemName}</h2>
        <div class="item-category">${item.category}</div>
        
        ${photosHtml}
        
        <div style="margin-top: 1.5rem;">
            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">📍 Location Details</h3>
            <div class="item-info">
                <div class="item-info-row">
                    <strong>Floor:</strong> ${item.location.floor}
                </div>
                <div class="item-info-row">
                    <strong>Location:</strong> ${locationText}
                </div>
            </div>
        </div>
        
        <div style="margin-top: 1.5rem;">
            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">🕐 Date & Time</h3>
            <div class="item-info">
                <div class="item-info-row">
                    <strong>Date:</strong> ${formatDate(item.date)}
                </div>
                <div class="item-info-row">
                    <strong>Time:</strong> ${formatTime(item.time)}
                </div>
                <div class="item-info-row">
                    <strong>Reported:</strong> ${timeAgo(item.createdAt)}
                </div>
            </div>
        </div>
        
        ${item.description ? `
            <div style="margin-top: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: var(--primary-color);">📝 Description</h3>
                <p style="color: var(--text-secondary);">${item.description}</p>
            </div>
        ` : ''}
        
        <div style="margin-top: 1.5rem;">
            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">👤 Reported By</h3>
            <p style="color: var(--text-secondary);">${item.submittedBy}</p>
        </div>
        
        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--border-color);">
            <p style="color: var(--text-secondary); font-size: 0.9rem; text-align: center;">
                If this is your item, please contact the administration office with proof of ownership.
            </p>
        </div>
    `;

  modal.classList.add('active');
}

// Close item detail modal
function closeItemModal() {
  const modal = document.getElementById('itemModal');
  modal.classList.remove('active');
}

// Apply filters
function applyFilters() {
  const floor = document.getElementById('filterFloor').value;
  const category = document.getElementById('filterCategory').value;
  const startDate = document.getElementById('filterStartDate').value;
  const endDate = document.getElementById('filterEndDate').value;

  filteredItems = allItems.filter(item => {
    // Floor filter
    if (floor && item.location.floor !== floor) {
      return false;
    }

    // Category filter
    if (category && item.category !== category) {
      return false;
    }

    // Date range filter
    if (startDate || endDate) {
      const itemDate = new Date(item.date);

      if (startDate) {
        const start = new Date(startDate);
        if (itemDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        if (itemDate > end) return false;
      }
    }

    return true;
  });

  displayItems(filteredItems);
}

// Clear all filters
function clearFilters() {
  document.getElementById('filterFloor').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterStartDate').value = '';
  document.getElementById('filterEndDate').value = '';

  filteredItems = [...allItems];
  displayItems(filteredItems);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  loadItems();

  // Close modal when clicking outside
  const modal = document.getElementById('itemModal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeItemModal();
    }
  });

  // Auto-apply filters on change
  const filterInputs = ['filterFloor', 'filterCategory', 'filterStartDate', 'filterEndDate'];
  filterInputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', applyFilters);
    }
  });

  // Refresh items every 60 seconds
  setInterval(loadItems, 60000);
});
