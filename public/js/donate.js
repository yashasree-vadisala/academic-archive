document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('donateForm');
    const submitBtn = document.getElementById('submitBtn');
    const imageUpload = document.getElementById('image');
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const description = document.getElementById('description');
    const charCount = document.getElementById('charCount');

    // Character counter
    description.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = count;
        
        if (count > 400) {
            charCount.parentElement.classList.add('warning');
        } else {
            charCount.parentElement.classList.remove('warning');
        }
        
        if (count > 500) {
            charCount.parentElement.classList.add('danger');
            this.value = this.value.substring(0, 500);
            charCount.textContent = 500;
        } else {
            charCount.parentElement.classList.remove('danger');
        }
    });

    // Image upload
    imageUploadArea.addEventListener('click', () => imageUpload.click());
    
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                imagePreview.classList.add('show');
            };
            reader.readAsDataURL(file);
        }
    });

    // Form validation and submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            alert('⚠️ Please login to donate items');
            window.location.href = 'login.html';
            return;
        }
        
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData();
            formData.append('title', document.getElementById('itemName').value);
            formData.append('description', description.value);
            formData.append('category', document.getElementById('category').value);
            formData.append('condition', 'good'); // Default condition
            formData.append('donorName', document.getElementById('donorName').value);
            formData.append('email', document.getElementById('email').value);
            formData.append('mobile', document.getElementById('mobile').value);
            
            // Handle image upload
            const imageFile = imageUpload.files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const response = await fetch('/api/donations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert('🎉 Item donated successfully! Students can now browse and request it.');
                form.reset();
                imagePreview.classList.remove('show');
                imagePreview.innerHTML = '';
                charCount.textContent = '0';
                window.location.href = 'dashboard.html';
            } else {
                alert(`❌ ${result.error || 'Failed to donate item'}`);
            }
        } catch (error) {
            console.error('Donation error:', error);
            alert('❌ Network error. Please try again.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    // Logout button if present
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "index.html";
      });
    }
});
