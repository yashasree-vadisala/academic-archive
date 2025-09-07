// api.js
/*const API_BASE_URL = "http://localhost:5000/api"; 
// 👆 change to your backend server URL later (example: https://academic-archive.onrender.com/api)

// Helper function for GET requests
async function apiGet(endpoint, token = null) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
  return res.json();
}

// Helper function for POST requests
async function apiPost(endpoint, body = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

export { apiGet, apiPost, API_BASE_URL };*/
