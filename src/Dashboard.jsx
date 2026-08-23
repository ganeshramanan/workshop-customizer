import { useEffect, useState } from "react";
import "./Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const INITIAL_ENQUIRIES = 5;
const ENQUIRIES_PER_PAGE = 10;

function Dashboard({ user, website, token, onEditWebsite, onLogout }) {
  const businessName = website?.businessName?.trim() || "Your Business";

  // ==================================================
  // ENQUIRY STATE
  // ==================================================

  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(true);
  const [enquiriesLoadingMore, setEnquiriesLoadingMore] = useState(false);
  const [enquiriesError, setEnquiriesError] = useState("");

  const [enquiryFilter, setEnquiryFilter] = useState("all");

  const [enquiryCounts, setEnquiryCounts] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    completed: 0,
  });

  const [hasMoreEnquiries, setHasMoreEnquiries] = useState(false);

  const [showAllEnquiries, setShowAllEnquiries] = useState(false);

  // ==================================================
  // LOAD ENQUIRIES
  // ==================================================

  const loadEnquiries = async ({
    status = enquiryFilter,
    offset = 0,
    append = false,
    limit = ENQUIRIES_PER_PAGE,
  } = {}) => {
    try {
      if (append) {
        setEnquiriesLoadingMore(true);
      } else {
        setEnquiriesLoading(true);
        setEnquiriesError("");
      }

      const response = await fetch(
        `${API_URL}/api/service-requests/my-requests?status=${status}&limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load enquiries");
      }

      const incoming = Array.isArray(result.enquiries) ? result.enquiries : [];

      setEnquiries((current) =>
        append ? [...current, ...incoming] : incoming,
      );

      if (result.counts) {
        setEnquiryCounts({
          total: Number(result.counts.total || 0),
          new: Number(result.counts.new || 0),
          contacted: Number(result.counts.contacted || 0),
          completed: Number(result.counts.completed || 0),
        });
      }

      setHasMoreEnquiries(Boolean(result.pagination?.hasMore));
    } catch (error) {
      console.error("Load enquiries error:", error);

      if (!append) {
        setEnquiriesError(error.message || "Failed to load enquiries");
      }
    } finally {
      if (append) {
        setEnquiriesLoadingMore(false);
      } else {
        setEnquiriesLoading(false);
      }
    }
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    if (!token) {
      setEnquiriesLoading(false);
      return;
    }

    setEnquiries([]);

    loadEnquiries({
      status: enquiryFilter,
      offset: 0,
      limit: showAllEnquiries ? ENQUIRIES_PER_PAGE : INITIAL_ENQUIRIES,
    });
  }, [token, enquiryFilter, showAllEnquiries]);

  // ==================================================
  // FILTER
  // ==================================================

  const changeEnquiryFilter = (filter) => {
    if (filter === enquiryFilter) {
      return;
    }

    setEnquiryFilter(filter);
    setShowAllEnquiries(true);
  };

  // ==================================================
  // VIEW ALL
  // ==================================================

  const handleViewAll = () => {
    setShowAllEnquiries(true);
  };

  // ==================================================
  // LOAD MORE
  // ==================================================

  const loadMoreEnquiries = () => {
    if (enquiriesLoadingMore || !hasMoreEnquiries) {
      return;
    }

    loadEnquiries({
      status: enquiryFilter,
      offset: enquiries.length,
      append: true,
      limit: ENQUIRIES_PER_PAGE,
    });
  };

  // ==================================================
  // UPDATE STATUS
  // ==================================================

  const updateEnquiryStatus = async (enquiryId, newStatus) => {
    try {
      const response = await fetch(
        `${API_URL}/api/service-requests/${enquiryId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update enquiry status");
      }

      // Update current row immediately
      setEnquiries((current) =>
        current.map((enquiry) =>
          enquiry.id === enquiryId
            ? {
                ...enquiry,
                status: newStatus,
              }
            : enquiry,
        ),
      );

      // Refresh counts
      await loadEnquiries({
        status: enquiryFilter,
        offset: 0,
        append: false,
        limit: showAllEnquiries ? ENQUIRIES_PER_PAGE : INITIAL_ENQUIRIES,
      });
    } catch (error) {
      console.error("Update enquiry status error:", error);

      alert(error.message || "Failed to update enquiry status");
    }
  };

  // ==================================================
  // HELPERS
  // ==================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getStatusClass = (status) => {
    const normalized = String(status || "new").toLowerCase();

    if (normalized === "completed") {
      return "status-pill completed";
    }

    if (normalized === "contacted") {
      return "status-pill contacted";
    }

    return "status-pill new";
  };

  const getStatusLabel = (status) => {
    const normalized = String(status || "new").toLowerCase();

    if (normalized === "completed") {
      return "Completed";
    }

    if (normalized === "contacted") {
      return "Contacted";
    }

    return "New";
  };

  const getCustomerName = (enquiry) =>
    enquiry.customerName || enquiry.customer_name || "Customer";

  const getCreatedDate = (enquiry) => enquiry.createdAt || enquiry.created_at;

  const getPreferredDate = (enquiry) =>
    enquiry.preferredDate || enquiry.preferred_date;

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* ==================================================
            TOP HEADER
           ================================================== */}

        <header className="dashboard-header">
          <div className="dashboard-brand">
            <div className="brand-mark">S</div>

            <div>
              <div className="brand-name">SiteCraft</div>

              <div className="brand-caption">Business workspace</div>
            </div>
          </div>

          <div className="dashboard-user-area">
            <div className="dashboard-user">
              <div className="user-avatar">
                {String(user?.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="user-details">
                <strong>{user?.name || "User"}</strong>

                <span>{user?.email || "Workspace"}</span>
              </div>
            </div>

            <button className="dashboard-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* ==================================================
            WELCOME
           ================================================== */}

        <section className="welcome-section">
          <div>
            <p className="welcome-eyebrow">OVERVIEW</p>

            <h1>Welcome back, {user?.name || "there"} 👋</h1>

            <p>
              Here's a quick look at your business website and customer
              activity.
            </p>
          </div>
        </section>

        {/* ==================================================
            WEBSITE CARD
           ================================================== */}

        <section className="website-card">
          <div className="website-main">
            <div className="website-icon">🏪</div>

            <div className="website-content">
              <div className="website-label">YOUR WEBSITE</div>

              <h2>{businessName}</h2>

              <div className="website-meta">
                <span>🎨 {website?.theme || "Blue"}</span>

                <span>
                  🛠️{" "}
                  {Array.isArray(website?.services)
                    ? website.services.length
                    : 0}{" "}
                  services
                </span>

                <span className="website-ready">● Ready</span>
              </div>
            </div>

            <button className="edit-website-button" onClick={onEditWebsite}>
              <span>✏️</span>
              Edit Website
              <span>→</span>
            </button>
          </div>
        </section>

        {/* ==================================================
            QUICK STATS
           ================================================== */}

        <section className="stats-grid">
          <button
            className={`stat-card ${enquiryFilter === "new" ? "selected" : ""}`}
            onClick={() => changeEnquiryFilter("new")}
          >
            <div className="stat-icon new-icon">🔵</div>

            <div>
              <strong>{enquiryCounts.new}</strong>

              <span>New enquiries</span>
            </div>
          </button>

          <button
            className={`stat-card ${
              enquiryFilter === "contacted" ? "selected" : ""
            }`}
            onClick={() => changeEnquiryFilter("contacted")}
          >
            <div className="stat-icon contacted-icon">📞</div>

            <div>
              <strong>{enquiryCounts.contacted}</strong>

              <span>Contacted</span>
            </div>
          </button>

          <button
            className={`stat-card ${
              enquiryFilter === "completed" ? "selected" : ""
            }`}
            onClick={() => changeEnquiryFilter("completed")}
          >
            <div className="stat-icon completed-icon">✅</div>

            <div>
              <strong>{enquiryCounts.completed}</strong>

              <span>Completed</span>
            </div>
          </button>

          <button
            className={`stat-card ${enquiryFilter === "all" ? "selected" : ""}`}
            onClick={() => changeEnquiryFilter("all")}
          >
            <div className="stat-icon total-icon">📩</div>

            <div>
              <strong>{enquiryCounts.total}</strong>

              <span>Total enquiries</span>
            </div>
          </button>
        </section>

        {/* ==================================================
            RECENT ENQUIRIES
           ================================================== */}

        <section className="enquiries-card">
          <div className="enquiries-header">
            <div>
              <p className="section-eyebrow">CUSTOMER ACTIVITY</p>

              <h2>
                {showAllEnquiries ? "Customer enquiries" : "Recent enquiries"}
              </h2>

              <p>
                {showAllEnquiries
                  ? "Manage requests received from your website."
                  : "Your latest customer requests."}
              </p>
            </div>

            {!showAllEnquiries && enquiryCounts.total > 0 && (
              <button className="view-all-button" onClick={handleViewAll}>
                View all enquiries →
              </button>
            )}
          </div>

          {/* FILTERS ONLY WHEN VIEWING ALL */}

          {showAllEnquiries && (
            <div className="enquiry-filters">
              {[
                ["all", "All", enquiryCounts.total],
                ["new", "New", enquiryCounts.new],
                ["contacted", "Contacted", enquiryCounts.contacted],
                ["completed", "Completed", enquiryCounts.completed],
              ].map(([value, label, count]) => (
                <button
                  key={value}
                  className={
                    enquiryFilter === value
                      ? "enquiry-filter active"
                      : "enquiry-filter"
                  }
                  onClick={() => changeEnquiryFilter(value)}
                >
                  {label}
                  <span>{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* LOADING */}

          {enquiriesLoading && (
            <div className="enquiries-loading">
              <div className="loading-spinner" />
              <span>Loading enquiries...</span>
            </div>
          )}

          {/* ERROR */}

          {!enquiriesLoading && enquiriesError && (
            <div className="enquiries-error">⚠️ {enquiriesError}</div>
          )}

          {/* EMPTY */}

          {!enquiriesLoading && !enquiriesError && enquiries.length === 0 && (
            <div className="enquiries-empty">
              <div>📭</div>

              <strong>
                {enquiryFilter === "all"
                  ? "No enquiries yet"
                  : `No ${getStatusLabel(
                      enquiryFilter,
                    ).toLowerCase()} enquiries`}
              </strong>

              <span>
                Customer requests will appear here when submitted through your
                website.
              </span>
            </div>
          )}

          {/* COMPACT ENQUIRY LIST */}

          {!enquiriesLoading && !enquiriesError && enquiries.length > 0 && (
            <div className="enquiry-table">
              <div className="enquiry-table-header">
                <span>Customer</span>
                <span>Service</span>
                <span>Date</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {enquiries.map((enquiry) => (
                <div className="enquiry-row" key={enquiry.id}>
                  <div className="customer-cell">
                    <div className="customer-avatar">
                      {String(getCustomerName(enquiry)).charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <strong>{getCustomerName(enquiry)}</strong>

                      <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>
                    </div>
                  </div>

                  <div className="service-cell">
                    {enquiry.service || "General enquiry"}
                  </div>

                  <div className="date-cell">
                    {formatDate(getCreatedDate(enquiry))}
                  </div>

                  <div className="status-cell">
                    <select
                      value={String(enquiry.status || "new").toLowerCase()}
                      onChange={(event) =>
                        updateEnquiryStatus(enquiry.id, event.target.value)
                      }
                      className="status-select"
                    >
                      <option value="new">New</option>

                      <option value="contacted">Contacted</option>

                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="action-cell">
                    <a href={`tel:${enquiry.phone}`} className="contact-button">
                      Call
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LOAD MORE */}

          {showAllEnquiries &&
            !enquiriesLoading &&
            !enquiriesError &&
            hasMoreEnquiries && (
              <div className="load-more-container">
                <button
                  className="load-more-button"
                  onClick={loadMoreEnquiries}
                  disabled={enquiriesLoadingMore}
                >
                  {enquiriesLoadingMore ? "Loading..." : "Load more enquiries"}
                </button>
              </div>
            )}

          {/* RECENT FOOTER */}

          {!showAllEnquiries && enquiries.length > 0 && (
            <div className="recent-footer">
              Showing your latest {enquiries.length} enquiries
            </div>
          )}
        </section>

        {/* ==================================================
            QUICK START
           ================================================== */}

        <section className="quick-start">
          <div className="quick-start-icon">✨</div>

          <div>
            <strong>Your online presence, simplified.</strong>

            <span>
              Update your website anytime and manage customer enquiries from one
              place.
            </span>
          </div>

          <button onClick={onEditWebsite}>Customize Website →</button>
        </section>

        {/* ==================================================
            FOOTER
           ================================================== */}

        <footer className="dashboard-footer">
          <span>SiteCraft</span>
          <span>•</span>
          <span>Business Workspace</span>
        </footer>
      </div>
    </div>
  );
}

export default Dashboard;
