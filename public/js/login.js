// public/js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  // ✅ Change this to your deployed backend URL
  const API_BASE_URL = "https://academic-archive-5.onrender.com";

  // Toggle password visibility
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      togglePassword.textContent = type === "password" ? "👁" : "👁‍🗨";
    });
  }

  // Handle form submission
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = passwordInput.value.trim();

      // Clear previous error messages
      document.getElementById("emailError").textContent = "";
      document.getElementById("passwordError").textContent = "";
      document.getElementById("emailError").classList.remove("show", "shake");
      document.getElementById("passwordError").classList.remove("show", "shake");

      // Client-side validation
      if (!email) {
        document.getElementById("emailError").textContent = "Email is required";
        document.getElementById("emailError").classList.add("show", "shake");
        return;
      }
      if (!password) {
        document.getElementById("passwordError").textContent = "Password is required";
        document.getElementById("passwordError").classList.add("show", "shake");
        return;
      }

      // Show loading state
      const submitBtn = document.getElementById("submitBtn");
      submitBtn.classList.add("loading");

      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        let data;
        try {
          data = await res.json();
        } catch (jsonErr) {
          throw new Error("Invalid JSON response from server");
        }

        submitBtn.classList.remove("loading");

        if (res.ok && data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          alert("✅ Login successful!");
          // Add delay to ensure alert is visible before redirect
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 1000);
        } else {
          document.getElementById("emailError").textContent = data.error || "Login failed";
          document.getElementById("emailError").classList.add("show", "shake");
        }
      } catch (err) {
        console.error("Network error:", err);
        submitBtn.classList.remove("loading");

        document.getElementById("emailError").textContent =
          err.message.includes("Invalid JSON")
            ? "⚠️ Server error: received invalid response"
            : "Network error, please check your connection and try again.";
        document.getElementById("emailError").classList.add("show", "shake");
      }
    });
  }
});
