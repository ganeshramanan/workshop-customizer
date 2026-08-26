import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

  const [copiedUserId, setCopiedUserId] = useState(null);

  // ==================================================
  // PUBLIC WEBSITE BASE URL
  // ==================================================

  const getPublicWebsiteUrl = (siteSlug) => {
    if (!siteSlug) {
      return "";
    }

    return `${window.location.origin}/site/${siteSlug}`;
  };

  // ==================================================
  // LOAD USERS
  // ==================================================

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/admin/users`, {
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

      setError(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // LOAD USERS WHEN TOKEN CHANGES
  // ==================================================

  useEffect(() => {
    if (token) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [token]);

  // ==================================================
  // CREATE CUSTOMER
  // ==================================================

  const handleCreateCustomer = async (event) => {
    event.preventDefault();

    setCreating(true);
    setCreateMessage("");
    setCreateError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
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

      setCreateError(error.message || "Failed to create customer");
    } finally {
      setCreating(false);
    }
  };

  // ==================================================
  // DELETE CUSTOMER
  // ==================================================

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

      const response = await fetch(`${API_URL}/api/admin/users/${user.id}`, {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete customer");
      }

      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== user.id),
      );
    } catch (error) {
      console.error("Delete customer error:", error);

      setError(error.message || "Failed to delete customer");
    } finally {
      setDeletingUserId(null);
    }
  };

  // ==================================================
  // OPEN WEBSITE
  // ==================================================

  const handleOpenWebsite = (user) => {
    const url = getPublicWebsiteUrl(user.siteSlug);

    if (!url) {
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ==================================================
  // COPY WEBSITE URL
  // ==================================================

  const handleCopyUrl = async (user) => {
    const url = getPublicWebsiteUrl(user.siteSlug);

    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);

      setCopiedUserId(user.id);

      setTimeout(() => {
        setCopiedUserId(null);
      }, 1500);
    } catch (error) {
      console.error("Copy URL error:", error);

      window.prompt("Copy this website URL:", url);
    }
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* ============================================
            HEADER
        ============================================ */}

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Admin Dashboard</h1>

            <p style={styles.subtitle}>Manage your customers and websites</p>
          </div>

          <div style={styles.headerActions}>
            <button
              style={styles.refreshButton}
              onClick={loadUsers}
              type="button"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              style={styles.createButton}
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setCreateMessage("");
                setCreateError("");
              }}
              type="button"
            >
              {showCreateForm ? "Close" : "+ Create Customer"}
            </button>
          </div>
        </div>

        {/* ============================================
            CREATE CUSTOMER FORM
        ============================================ */}

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

        {/* ============================================
            CUSTOMER CARD
        ============================================ */}

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Customers</h2>

              <p style={styles.cardSubtitle}>
                View customers and their public websites
              </p>
            </div>

            <span style={styles.count}>
              {users.length} {users.length === 1 ? "user" : "users"}
            </span>
          </div>

          {loading && <div style={styles.emptyMessage}>Loading users...</div>}

          {error && <p style={styles.error}>{error}</p>}

          {!loading && !error && users.length === 0 && (
            <div style={styles.emptyMessage}>No users found.</div>
          )}

          {/* ==========================================
              DESKTOP TABLE
          ========================================== */}

          {!loading && !error && users.length > 0 && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Customer</th>

                    <th style={styles.th}>Business</th>

                    <th style={styles.th}>Role</th>

                    <th style={styles.th}>Website</th>

                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => {
                    const websiteUrl = getPublicWebsiteUrl(user.siteSlug);

                    return (
                      <tr key={user.id}>
                        {/* CUSTOMER */}

                        <td style={styles.td}>
                          <div style={styles.customerName}>
                            {user.name || "-"}
                          </div>

                          <div style={styles.email}>{user.email || "-"}</div>
                        </td>

                        {/* BUSINESS */}

                        <td style={styles.td}>
                          <div style={styles.businessName}>
                            {user.businessName || "Not configured"}
                          </div>

                          {user.websiteId && (
                            <div style={styles.websiteId}>
                              Website ID: {user.websiteId}
                            </div>
                          )}
                        </td>

                        {/* ROLE */}

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

                        {/* WEBSITE */}

                        <td style={styles.td}>
                          {user.siteSlug ? (
                            <div>
                              <div style={styles.slug}>
                                /site/{user.siteSlug}
                              </div>

                              {user.siteName && (
                                <div style={styles.siteName}>
                                  {user.siteName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={styles.noWebsite}>
                              Not created yet
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td style={styles.td}>
                          {user.role !== "admin" ? (
                            <div style={styles.actionGroup}>
                              {websiteUrl ? (
                                <>
                                  <button
                                    type="button"
                                    style={styles.openButton}
                                    onClick={() => handleOpenWebsite(user)}
                                  >
                                    Open Website
                                  </button>

                                  <button
                                    type="button"
                                    style={styles.copyButton}
                                    onClick={() => handleCopyUrl(user)}
                                  >
                                    {copiedUserId === user.id
                                      ? "Copied!"
                                      : "Copy URL"}
                                  </button>
                                </>
                              ) : (
                                <span style={styles.noWebsite}>
                                  No website URL
                                </span>
                              )}

                              <button
                                style={styles.deleteButton}
                                onClick={() => handleDeleteCustomer(user)}
                                disabled={deletingUserId === user.id}
                                type="button"
                              >
                                {deletingUserId === user.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          ) : (
                            <span style={styles.protectedText}>Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ==========================================
              MOBILE CARDS
          ========================================== */}

          {!loading && !error && users.length > 0 && (
            <div style={styles.mobileUsers}>
              {users.map((user) => {
                const websiteUrl = getPublicWebsiteUrl(user.siteSlug);

                return (
                  <div key={user.id} style={styles.mobileUserCard}>
                    <div style={styles.mobileTopRow}>
                      <div>
                        <div style={styles.customerName}>
                          {user.name || "-"}
                        </div>

                        <div style={styles.email}>{user.email || "-"}</div>
                      </div>

                      <span
                        style={
                          user.role === "admin"
                            ? styles.adminBadge
                            : styles.customerBadge
                        }
                      >
                        {user.role}
                      </span>
                    </div>

                    <div style={styles.mobileInfo}>
                      <div style={styles.mobileLabel}>Business</div>

                      <div style={styles.mobileValue}>
                        {user.businessName || "Not configured"}
                      </div>
                    </div>

                    <div style={styles.mobileInfo}>
                      <div style={styles.mobileLabel}>Website</div>

                      {user.siteSlug ? (
                        <>
                          <div style={styles.mobileSlug}>
                            /site/{user.siteSlug}
                          </div>

                          {user.siteName && (
                            <div style={styles.siteName}>{user.siteName}</div>
                          )}
                        </>
                      ) : (
                        <div style={styles.noWebsite}>Not created yet</div>
                      )}
                    </div>

                    {user.role !== "admin" && (
                      <div style={styles.mobileActions}>
                        {websiteUrl && (
                          <>
                            <button
                              type="button"
                              style={styles.mobileOpenButton}
                              onClick={() => handleOpenWebsite(user)}
                            >
                              Open Website
                            </button>

                            <button
                              type="button"
                              style={styles.mobileCopyButton}
                              onClick={() => handleCopyUrl(user)}
                            >
                              {copiedUserId === user.id
                                ? "Copied!"
                                : "Copy URL"}
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          style={styles.mobileDeleteButton}
                          onClick={() => handleDeleteCustomer(user)}
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================================================
          RESPONSIVE CSS
      ================================================= */}

      <style>
        {`
          @media (max-width: 800px) {
            .admin-desktop-table {
              display: none;
            }
          }
        `}
      </style>
    </div>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  // --------------------------------------------------
  // HEADER
  // --------------------------------------------------

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.2,
    color: "#111827",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  headerActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  refreshButton: {
    padding: "9px 15px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },

  createButton: {
    padding: "9px 15px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  formCard: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "22px",
    marginBottom: "20px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },

  formTitle: {
    margin: "0 0 18px",
    fontSize: "20px",
    color: "#111827",
  },

  label: {
    display: "block",
    fontWeight: "600",
    marginTop: "13px",
    marginBottom: "6px",
    fontSize: "13px",
    color: "#374151",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },

  submitButton: {
    marginTop: "18px",
    padding: "10px 17px",
    border: "none",
    borderRadius: "8px",
    background: "#16a34a",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },

  // --------------------------------------------------
  // CARD
  // --------------------------------------------------

  card: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "22px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "18px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#111827",
  },

  cardSubtitle: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#6b7280",
  },

  count: {
    color: "#6b7280",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  // --------------------------------------------------
  // TABLE
  // --------------------------------------------------

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
  },

  th: {
    textAlign: "left",
    padding: "11px 10px",
    borderBottom: "2px solid #e5e7eb",
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.02em",
  },

  td: {
    padding: "13px 10px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "13px",
    color: "#374151",
    verticalAlign: "middle",
  },

  // --------------------------------------------------
  // CUSTOMER
  // --------------------------------------------------

  customerName: {
    fontWeight: "600",
    color: "#111827",
    fontSize: "14px",
  },

  email: {
    marginTop: "3px",
    color: "#6b7280",
    fontSize: "12px",
  },

  businessName: {
    fontWeight: "600",
    color: "#374151",
  },

  websiteId: {
    marginTop: "3px",
    color: "#9ca3af",
    fontSize: "11px",
  },

  // --------------------------------------------------
  // WEBSITE
  // --------------------------------------------------

  slug: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#2563eb",
    wordBreak: "break-all",
  },

  mobileSlug: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#2563eb",
    wordBreak: "break-all",
  },

  siteName: {
    marginTop: "3px",
    color: "#6b7280",
    fontSize: "11px",
  },

  noWebsite: {
    color: "#9ca3af",
    fontSize: "12px",
    fontStyle: "italic",
  },

  // --------------------------------------------------
  // BADGES
  // --------------------------------------------------

  adminBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "6px",
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: "11px",
    fontWeight: "700",
  },

  customerBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "6px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "11px",
    fontWeight: "700",
  },

  // --------------------------------------------------
  // ACTIONS
  // --------------------------------------------------

  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },

  openButton: {
    padding: "7px 10px",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "11px",
    whiteSpace: "nowrap",
  },

  copyButton: {
    padding: "7px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "11px",
    whiteSpace: "nowrap",
  },

  deleteButton: {
    padding: "7px 10px",
    border: "none",
    borderRadius: "6px",
    background: "#dc2626",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "11px",
    whiteSpace: "nowrap",
  },

  protectedText: {
    color: "#9ca3af",
    fontSize: "11px",
    fontWeight: "600",
  },

  // --------------------------------------------------
  // MOBILE
  // --------------------------------------------------

  mobileUsers: {
    display: "none",
  },

  mobileUserCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "15px",
    marginBottom: "10px",
    background: "#ffffff",
  },

  mobileTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "14px",
  },

  mobileInfo: {
    padding: "10px 0",
    borderTop: "1px solid #f1f5f9",
  },

  mobileLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    marginBottom: "4px",
  },

  mobileValue: {
    fontSize: "13px",
    color: "#374151",
    fontWeight: "500",
  },

  mobileActions: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #f1f5f9",
  },

  mobileOpenButton: {
    flex: "1 1 100px",
    padding: "9px 10px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },

  mobileCopyButton: {
    flex: "1 1 90px",
    padding: "9px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },

  mobileDeleteButton: {
    flex: "1 1 70px",
    padding: "9px 10px",
    border: "none",
    borderRadius: "7px",
    background: "#dc2626",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },

  // --------------------------------------------------
  // MESSAGES
  // --------------------------------------------------

  emptyMessage: {
    padding: "30px 10px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
  },

  error: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: "13px",
  },

  success: {
    color: "#16a34a",
    fontWeight: "600",
    fontSize: "13px",
  },
};

export default AdminDashboard;
