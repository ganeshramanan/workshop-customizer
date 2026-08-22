import { useEffect, useState } from "react";

function AdminDashboard({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");

  const [deletingUserId, setDeletingUserId] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load users");
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error("Admin users error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  const handleCreateCustomer = async (event) => {
    event.preventDefault();

    setCreating(true);
    setCreateMessage("");
    setCreateError("");

    try {
      const response = await fetch("http://localhost:5000/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create customer");
      }

      setCreateMessage("Customer created successfully.");

      setName("");
      setEmail("");
      setPassword("");

      await loadUsers();

      setTimeout(() => {
        setShowCreateForm(false);
        setCreateMessage("");
      }, 1000);
    } catch (error) {
      console.error("Create customer error:", error);
      setCreateError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCustomer = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?\n\nThis will permanently delete the customer and their website.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(user.id);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/admin/users/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete customer");
      }

      // Remove deleted customer immediately from the UI
      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== user.id),
      );
    } catch (error) {
      console.error("Delete customer error:", error);
      setError(error.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>

          <p style={styles.subtitle}>Manage your customers and websites</p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.refreshButton} onClick={loadUsers}>
            Refresh
          </button>

          <button
            style={styles.createButton}
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setCreateMessage("");
              setCreateError("");
            }}
          >
            {showCreateForm ? "Close" : "+ Create Customer"}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Create Customer</h2>

          <form onSubmit={handleCreateCustomer}>
            <label style={styles.label}>Name</label>

            <input
              style={styles.input}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Customer name"
              required
            />

            <label style={styles.label}>Email</label>

            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="customer@example.com"
              required
            />

            <label style={styles.label}>Password</label>

            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Customer password"
              required
            />

            {createError && <p style={styles.error}>{createError}</p>}

            {createMessage && <p style={styles.success}>{createMessage}</p>}

            <button
              type="submit"
              style={styles.submitButton}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Customer"}
            </button>
          </form>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Customers</h2>

          <span style={styles.count}>{users.length} users</span>
        </div>

        {loading && <p style={styles.message}>Loading users...</p>}

        {error && <p style={styles.error}>{error}</p>}

        {!loading && !error && users.length === 0 && (
          <p style={styles.message}>No users found.</p>
        )}

        {!loading && !error && users.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>

                  <th style={styles.th}>Email</th>

                  <th style={styles.th}>Role</th>

                  <th style={styles.th}>Business</th>

                  <th style={styles.th}>Website</th>

                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={styles.td}>{user.name}</td>

                    <td style={styles.td}>{user.email}</td>

                    <td style={styles.td}>
                      <span
                        style={
                          user.role === "admin"
                            ? styles.adminBadge
                            : styles.customerBadge
                        }
                      >
                        {user.role}
                      </span>
                    </td>

                    <td style={styles.td}>{user.businessName || "-"}</td>

                    <td style={styles.td}>{user.websiteId || "-"}</td>

                    <td style={styles.td}>
                      {user.role !== "admin" ? (
                        <button
                          style={styles.deleteButton}
                          onClick={() => handleDeleteCustomer(user)}
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      ) : (
                        <span style={styles.protectedText}>Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    maxWidth: "1100px",
    margin: "0 auto 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
  },

  subtitle: {
    marginTop: "8px",
    color: "#666",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
  },

  refreshButton: {
    padding: "10px 18px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  createButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  formCard: {
    maxWidth: "1100px",
    margin: "0 auto 25px",
    background: "white",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
  },

  formTitle: {
    marginTop: 0,
    marginBottom: "20px",
  },

  label: {
    display: "block",
    fontWeight: "bold",
    marginTop: "15px",
    marginBottom: "7px",
  },

  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  submitButton: {
    marginTop: "20px",
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  card: {
    maxWidth: "1100px",
    margin: "0 auto",
    background: "white",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  cardTitle: {
    margin: 0,
  },

  count: {
    color: "#666",
    fontSize: "14px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #eee",
    fontSize: "14px",
  },

  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
  },

  adminBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "6px",
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: "12px",
    fontWeight: "bold",
  },

  customerBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "6px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "12px",
    fontWeight: "bold",
  },

  deleteButton: {
    padding: "7px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },

  protectedText: {
    color: "#888",
    fontSize: "12px",
    fontWeight: "bold",
  },

  message: {
    color: "#666",
  },

  error: {
    color: "#dc2626",
    fontWeight: "bold",
  },

  success: {
    color: "#16a34a",
    fontWeight: "bold",
  },
};

export default AdminDashboard;
