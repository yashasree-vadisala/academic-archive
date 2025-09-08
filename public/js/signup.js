
// public/js/signup.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

  // 🔗 Base URL for backend API
  const API_BASE_URL = "https://academic-archive-5.onrender.com";

  // Toggle password visibility
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      togglePassword.textContent = type === "password" ? "👁" : "👁‍🗨";
    });
  }

  if (toggleConfirmPassword && confirmPasswordInput) {
    toggleConfirmPassword.addEventListener("click", () => {
      const type = confirmPasswordInput.getAttribute("type") === "password" ? "text" : "password";
      confirmPasswordInput.setAttribute("type", type);
      toggleConfirmPassword.textContent = type === "password" ? "👁" : "👁‍🗨";
    });
  }

  // Password requirement indicators
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const password = passwordInput.value;
      document.getElementById("lengthReq").querySelector(".req-icon").textContent = password.length >= 8 ? "✅" : "❌";
      document.getElementById("upperReq").querySelector(".req-icon").textContent = /[A-Z]/.test(password) ? "✅" : "❌";
      document.getElementById("specialReq").querySelector(".req-icon").textContent = /[!@#$%^&*]/.test(password) ? "✅" : "❌";
      document.getElementById("passwordRequirements").classList.add("show");
    });
    passwordInput.addEventListener("focus", () => {
      document.getElementById("passwordRequirements").classList.add("show");
    });
    passwordInput.addEventListener("blur", () => {
      if (!passwordInput.value) {
        document.getElementById("passwordRequirements").classList.remove("show");
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Form submission triggered");

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = passwordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();

      // Clear previous error messages
      document.getElementById("nameError").textContent = "";
      document.getElementById("emailError").textContent = "";
      document.getElementById("passwordError").textContent = "";
      document.getElementById("confirmPasswordError").textContent = "";
      document.getElementById("nameError").classList.remove("show", "shake");
      document.getElementById("emailError").classList.remove("show", "shake");
      document.getElementById("passwordError").classList.remove("show", "shake");
      document.getElementById("confirmPasswordError").classList.remove("show", "shake");

      // Client-side validation
      if (!name || !email || !password || !confirmPassword) {
        if (!name) {
          document.getElementById("nameError").textContent = "Name is required";
          document.getElementById("nameError").classList.add("show", "shake");
        }
        if (!email) {
          document.getElementById("emailError").textContent = "Email is required";
          document.getElementById("emailError").classList.add("show", "shake");
        }
        if (!password) {
          document.getElementById("passwordError").textContent = "Password is required";
          document.getElementById("passwordError").classList.add("show", "shake");
        }
        if (!confirmPassword) {
          document.getElementById("confirmPasswordError").textContent = "Confirm password is required";
          document.getElementById("confirmPasswordError").classList.add("show", "shake");
        }
        console.log("Validation failed: Missing fields");
        return;
      }

      const lengthReq = password.length >= 8;
      const upperReq = /[A-Z]/.test(password);
      const specialReq = /[!@#$%^&*]/.test(password);
      if (!lengthReq || !upperReq || !specialReq) {
        document.getElementById("passwordError").textContent =
          "Password must be at least 8 characters, include 1 uppercase letter, and 1 special character.";
        document.getElementById("passwordError").classList.add("show", "shake");
        console.log("Validation failed: Password requirements not met");
        return;
      }

      if (password !== confirmPassword) {
        document.getElementById("confirmPasswordError").textContent = "Passwords do not match.";
        document.getElementById("confirmPasswordError").classList.add("show", "shake");
        console.log("Validation failed: Passwords do not match");
        return;
      }

      // Show loading state
      const submitBtn = document.getElementById("submitBtn");
      submitBtn.classList.add("loading");

      try {
        console.log("Sending request to /auth/register", { name, email });
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        console.log("Response from /auth/register:", data);

        submitBtn.classList.remove("loading");

        if (res.ok) {
          alert("✅ Signup successful! You can now login.");
          window.location.href = "login.html";
        } else {
          document.getElementById("emailError").textContent = data.error || "Signup failed";
          document.getElementById("emailError").classList.add("show", "shake");
          console.log("Signup failed with error:", data.error);
        }
      } catch (err) {
        console.error("Network error:", err);
        submitBtn.classList.remove("loading");
        document.getElementById("emailError").textContent = "Network error, please try again.";
        document.getElementById("emailError").classList.add("show", "shake");
      }
    });
  }
});
