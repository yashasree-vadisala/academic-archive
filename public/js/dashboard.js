// public/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    alert("⚠️ Please login first.");
    window.location.href = "login.html";
    return;
  }

  // Show welcome message
  const welcome = document.getElementById("welcomeMessage");
  if (welcome) {
    welcome.textContent = `Welcome, ${user.name || "Student"}!`;
  }

  // Create or get error div
  let errorDiv = document.getElementById("dashboardError");
  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.id = "dashboardError";
    errorDiv.className = "error-message";
    document.body.appendChild(errorDiv);
  }

  // Fetch site statistics
  async function loadStats() {
    try {
      const res = await fetch("/api/stats", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const stats = await res.json();

      if (res.ok) {
        if (document.getElementById("statDonations"))
          document.getElementById("statDonations").textContent = stats.availableItems || 0;
        if (document.getElementById("statUsers"))
          document.getElementById("statUsers").textContent = stats.users || 0;
        if (document.getElementById("statAvgResponse"))
          document.getElementById("statAvgResponse").textContent = stats.avgResponse || "0.00"; // Use as string
        errorDiv.textContent = ""; // Clear error on success
        errorDiv.classList.remove("show", "shake");
      } else {
        throw new Error(stats.error || `Server error: ${res.status}`);
      }
    } catch (err) {
      console.error("Error fetching stats:", err.name, err.message, err.stack);
      if (!navigator.onLine || (err.name === "TypeError" && err.message.includes("Failed to fetch"))) {
        errorDiv.textContent = "Network error, please check your connection and try again.";
      } else {
        errorDiv.textContent = `An unexpected error occurred: ${err.message}. Please try again or contact support.`;
      }
      errorDiv.classList.add("show", "shake");
    }
  }

  // Fetch and display recent activity
  async function loadRecentActivity() {
    const activityList = document.getElementById("activityList");
    if (!activityList) {
      console.error("Activity list element not found!");
      return;
    }

    try {
      const res = await fetch("/api/recent-activity", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();

      if (result.success && result.data.length > 0) {
        activityList.innerHTML = "";
        result.data.forEach(activity => {
          const activityItem = document.createElement("div");
          activityItem.className = "activity-item";
          const icon = activity.type === "donation" ? "📖" : "📝";
          const action = activity.type === "donation" ? "Donated by" : "Requested by";
          activityItem.innerHTML = `
            <div class="activity-icon">${icon}</div>
            <div class="activity-content">
              <h4>${activity.title}</h4>
              <p>${action} ${activity.userName}</p>
            </div>
            <div class="activity-time">${formatDate(activity.createdAt)}</div>
          `;
          activityList.appendChild(activityItem);
        });
      } else {
        activityList.innerHTML = '<div class="activity-item"><p>No recent activity found.</p></div>';
      }
    } catch (err) {
      console.error("Error fetching recent activity:", err);
      activityList.innerHTML = '<div class="activity-item"><p>Network error. Please try again.</p></div>';
    }
  }

  // Format date for recent activity
  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHrs < 1) return "Just now";
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });
  }

  // Initial load
  loadStats();
  loadRecentActivity();
});