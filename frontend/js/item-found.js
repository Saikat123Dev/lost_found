// Item Found Form functionality

let selectedFiles = [];

// Toggle room input based on room type
function toggleRoomInput() {
  const roomType = document.getElementById('roomType').value;
  const roomNumberGroup = document.getElementById('roomNumberGroup');
  const specificLocationGroup = document.getElementById('specificLocationGroup');
  const roomNumber = document.getElementById('roomNumber');
  const specificLocation = document.getElementById('specificLocation');

  // Reset
  roomNumberGroup.style.display = 'none';
  specificLocationGroup.style.display = 'none';
  roomNumber.required = false;
  specificLocation.required = false;

  if (roomType === 'room') {
    roomNumberGroup.style.display = 'block';
    roomNumber.required = true;
  } else if (roomType === 'washroom' || roomType === 'other') {
    specificLocationGroup.style.display = 'block';
    specificLocation.required = true;
  }
}

// Handle file selection
function handleFileSelect(event) {
  const files = Array.from(event.target.files);

  if (selectedFiles.length + files.length > 5) {
    showNotification('Maximum 5 photos allowed', 'error');
    return;
  }

  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      showNotification(`${file.name} is too large. Max 5MB per file.`, 'error');
      return;
    }

    selectedFiles.push(file);
  });

  updatePhotoPreview();
}

// Update photo preview
function updatePhotoPreview() {
  const preview = document.getElementById('photoPreview');
  preview.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-photo" onclick="removePhoto(${index})">×</button>
            `;
      preview.appendChild(previewItem);
    };
    reader.readAsDataURL(file);
  });
}

// Remove photo from selection
function removePhoto(index) {
  selectedFiles.splice(index, 1);
  updatePhotoPreview();
}

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('foundItemForm');
  if (!form) return;

  // Set max date to today
  const dateInput = document.getElementById('date');
  if (dateInput) {
    dateInput.max = new Date().toISOString().split('T')[0];
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!requireUser()) return;

    // Get form data
    const formData = new FormData();
    formData.append('type', 'found');
    formData.append('floor', document.getElementById('floor').value);

    const roomType = document.getElementById('roomType').value;
    if (roomType === 'room') {
      formData.append('room', document.getElementById('roomNumber').value);
    } else {
      formData.append('specificLocation', document.getElementById('specificLocation').value);
    }

    formData.append('date', document.getElementById('date').value);
    formData.append('time', document.getElementById('time').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('itemName', document.getElementById('itemName').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('submittedBy', getUsername());

    // Add photos
    selectedFiles.forEach(file => {
      formData.append('photos', file);
    });

    // Show progress
    const submitProgress = document.getElementById('submitProgress');
    const formActions = document.querySelector('.form-actions');
    submitProgress.style.display = 'block';
    formActions.style.display = 'none';

    try {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit report');
      }

      // Award points
      await awardPoints(10, 'report');

      // Show success modal
      const successModal = document.getElementById('successModal');
      successModal.classList.add('active');

      // Hide progress
      submitProgress.style.display = 'none';
      formActions.style.display = 'flex';

    } catch (error) {
      console.error('Submission error:', error);
      showNotification(error.message || 'Failed to submit report. Please try again.', 'error');
      submitProgress.style.display = 'none';
      formActions.style.display = 'flex';
    }
  });
});

// Reset form for another report
function resetForm() {
  const successModal = document.getElementById('successModal');
  successModal.classList.remove('active');

  document.getElementById('foundItemForm').reset();
  selectedFiles = [];
  updatePhotoPreview();
  toggleRoomInput();
}
