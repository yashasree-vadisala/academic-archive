
// public/js/browse.js
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.querySelector('.search-btn');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const itemsContainer = document.getElementById('itemsContainer');
  const resultCount = document.getElementById('resultCount');
  const loadMoreBtn = document.querySelector('.load-more .btn');
  let currentPage = 1;
  let currentCategory = 'all';
  let currentSearch = '';

  if (!itemsContainer) {
    console.error('Items container not found!');
    return;
  }

  // Fetch and display donations
  async function loadDonations(page = 1, append = false) {
    try {
      const query = new URLSearchParams({
        status: 'available',
        page,
        limit: 10,
        category: currentCategory === 'all' ? '' : currentCategory,
        search: currentSearch,
      });
      console.log('Fetching items with query:', query.toString());
      const response = await fetch(`/api/donations?${query}`);
      const result = await response.json();

      if (result.success) {
        if (!append) {
          itemsContainer.innerHTML = ''; // Clear items unless appending
        }
        if (result.data.length === 0 && page === 1) {
          itemsContainer.innerHTML = '<p class="no-items">No items found matching your criteria.</p>';
          updateResultCount(0);
          loadMoreBtn.style.display = 'none';
          return;
        }
        displayDonations(result.data);
        updateResultCount(itemsContainer.children.length);
        loadMoreBtn.style.display = result.data.length < 10 ? 'none' : 'block';
      } else {
        console.error('Failed to load donations:', result.error);
        itemsContainer.innerHTML = '<p class="no-items">Failed to load donations. Please try again later.</p>';
        updateResultCount(0);
        loadMoreBtn.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading donations:', error);
      itemsContainer.innerHTML = '<p class="no-items">Network error. Please check your connection.</p>';
      updateResultCount(0);
      loadMoreBtn.style.display = 'none';
    }
  }

  // Display donations in the UI
  function displayDonations(donations) {
    const loggedInUserId = JSON.parse(localStorage.getItem('user'))?._id || '';
    console.log('Logged in user ID:', loggedInUserId); // Debug
    donations.forEach(donation => {
      console.log('Item userId:', donation.userId._id); // Debug
      const itemCard = document.createElement('div');
      itemCard.className = 'item-card';
      itemCard.dataset.category = donation.category;
      // Add Delete button only if the logged-in user is the uploader
      const deleteButton = donation.userId._id === loggedInUserId
        ? `<button class="delete-btn" data-id="${donation._id}">Delete</button>`
        : '';
      itemCard.innerHTML = `
        <div class="item-image">
          <img src="${donation.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}" 
               alt="${donation.title}" 
               onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
        </div>
        <div class="item-content">
          <h3>${donation.title}</h3>
          <p class="item-description">${donation.description}</p>
          <div class="item-meta">
            <span class="category">${capitalizeFirst(donation.category)}</span>
            <span class="date">${formatDate(donation.createdAt)}</span>
          </div>
          <div class="donor-info">
            <span class="donor">Donated by ${donation.donor.name}</span>
          </div>
          <button class="contact-btn" data-id="${donation._id}">Contact</button>
          ${deleteButton}
        </div>
      `;
      itemsContainer.appendChild(itemCard);
    });
  }

  // Contact donor functionality
  async function contactDonor(donationId) {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ Please login to contact donors');
      window.location.href = 'login.html';
      return;
    }

    try {
      const response = await fetch(`/api/donations/${donationId}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (result.success) {
        alert(`📧 Contact Information:\nEmail: ${result.data.email}\nMobile: ${result.data.mobile}`);
      } else {
        alert(`❌ ${result.error || 'Failed to retrieve donor contact information'}`);
      }
    } catch (error) {
      console.error('Contact error:', error);
      alert('❌ Network error. Please try again.');
    }
  }

  // Delete item functionality
  async function deleteItem(donationId) {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ Please login to delete items');
      window.location.href = 'login.html';
      return;
    }

    const password = prompt('Enter your password to confirm deletion:');
    if (!password) {
      alert('⚠️ Password is required to delete the item');
      return;
    }

    try {
      const response = await fetch(`/api/donations/${donationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();

      if (result.success) {
        alert('✅ Item deleted successfully!');
        currentPage = 1; // Reset to first page
        loadDonations(1); // Refresh list
      } else {
        alert(`❌ ${result.error || 'Failed to delete item'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Network error. Please try again.');
    }
  }

  // Update results count
  function updateResultCount(count) {
    if (resultCount) {
      resultCount.textContent = count;
    }
  }

  // Capitalize first letter
  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Category filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      currentPage = 1; // Reset to first page
      loadDonations(1);
    });
  });

  // Search functionality
  searchBtn.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1; // Reset to first page
    loadDonations(1);
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentSearch = searchInput.value.trim();
      currentPage = 1; // Reset to first page
      loadDonations(1);
    }
  });

  // Load more items
  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    loadDonations(currentPage, true); // Append items
  });

  // Event delegation for contact and delete buttons
  itemsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('contact-btn')) {
      const donationId = e.target.dataset.id;
      contactDonor(donationId);
    } else if (e.target.classList.contains('delete-btn')) {
      const donationId = e.target.dataset.id;
      deleteItem(donationId);
    }
  });

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
    });
  }

  // Initial load
  loadDonations();
});