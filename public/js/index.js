
// public/js/index.js
document.addEventListener("DOMContentLoaded", async () => {
  const statItemsShared = document.getElementById("statItemsShared");
  const statActiveStudents = document.getElementById("statActiveStudents");
  const statItemsAvailable = document.getElementById("statItemsAvailable");

  // Fetch site statistics
  async function loadStats() {
    try {
      const res = await fetch("/api/stats");
      const stats = await res.json();

      if (stats.success) {
        if (statItemsShared)
          statItemsShared.textContent = stats.totalItems || 0;
        if (statActiveStudents)
          statActiveStudents.textContent = stats.users || 0;
        if (statItemsAvailable)
          statItemsAvailable.textContent = stats.availableItems || 0;
      } else {
        console.error("Failed to load stats:", stats.error || "Unknown error");
        if (statItemsShared) statItemsShared.textContent = "0";
        if (statActiveStudents) statActiveStudents.textContent = "0";
        if (statItemsAvailable) statItemsAvailable.textContent = "0";
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      if (statItemsShared) statItemsShared.textContent = "0";
      if (statActiveStudents) statActiveStudents.textContent = "0";
      if (statItemsAvailable) statItemsAvailable.textContent = "0";
    }
  }

  // Initial load
  loadStats();
});
