import { useEffect, useState } from "react";
import "./Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Dashboard({ user, website, token, onEditWebsite, onLogout }) {
  const businessName = website?.businessName?.trim();

  // ==================================================
  // CUSTOMER ENQUIRIES STATE
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

  const ENQUIRIES_PER_PAGE = 10;

  // ==================================================
  // LOAD CUSTOMER ENQUIRIES
  // ==================================================

  const loadEnquiries = async ({
    status = enquiryFilter,
    offset = 0,
    append = false,
  } = {}) => {
    try {
      if (append) {
        setEnquiriesLoadingMore(true);
      } else {
        setEnquiriesLoading(true);
        setEnquiriesError("");
      }

      const response = await fetch(
        `${API_URL}/api/service-requests/my-requests?status=${status}&limit=${ENQUIRIES_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load customer enquiries");
      }

      const newEnquiries = Array.isArray(result.enquiries)
        ? result.enquiries
        : [];

      setEnquiries((current) =>
        append ? [...current, ...newEnquiries] : newEnquiries,
      );

      if (result.counts) {
        setEnquiryCounts({
          total: Number(result.counts.total || 0),
          new: Number(result.counts.new || 0),
          contacted: Number(result.counts.contacted || 0),
          completed: Number(result.counts.completed || 0),
        });
      }

      setHasMoreEnquiries(result.pagination?.hasMore || false);
    } catch (error) {
      console.error("Load enquiries error:", error);

      if (!append) {
        setEnquiriesError(error.message || "Failed to load customer enquiries");
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
  // INITIAL LOAD / FILTER CHANGE
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
      append: false,
    });
  }, [token, enquiryFilter]);

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
    });
  };

  // ==================================================
  // CHANGE FILTER
  // ==================================================

  const changeEnquiryFilter = (newFilter) => {
    if (newFilter === enquiryFilter) {
      return;
    }

    setEnquiryFilter(newFilter);
  };

  // ==================================================
  // UPDATE ENQUIRY STATUS
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

      setEnquiries((currentEnquiries) =>
        currentEnquiries.map((enquiry) =>
          enquiry.id === enquiryId
            ? {
                ...enquiry,
                status: newStatus,
              }
            : enquiry,
        ),
      );

      await loadEnquiries({
        status: enquiryFilter,
        offset: 0,
        append: false,
      });
    } catch (error) {
      console.error("Update enquiry status error:", error);

      alert(error.message || "Failed to update enquiry status");
    }
  };

  // ==================================================
  // FORMAT DATE
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

  // ==================================================
  // STATUS HELPERS
  // ==================================================

  const getStatusClass = (status) => {
    const normalizedStatus = String(status || "new").toLowerCase();

    if (normalizedStatus === "completed") {
      return "enquiry-status completed";
    }

    if (normalizedStatus === "contacted") {
      return "enquiry-status contacted";
    }

    return "enquiry-status new";
  };

  const getStatusLabel = (status) => {
    const normalizedStatus = String(status || "new").toLowerCase();

    if (normalizedStatus === "completed") {
      return "Completed";
    }

    if (normalizedStatus === "contacted") {
      return "Contacted";
    }

    return "New";
  };

  // ==================================================
  // DASHBOARD
  // ==================================================

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* ==================================================
            TOP HEADER
           ================================================== */}

        <header className="dashboard-header">
          <div className="dashboard-brand-area">
            <div className="dashboard-brand">
              <div className="dashboard-brand-icon">✦</div>

              <span>SiteCraft</span>
            </div>

            <div className="dashboard-welcome">
              <p className="dashboard-eyebrow">DASHBOARD</p>

              <h1>Good morning, {user?.name || "there"} 👋</h1>

              <p className="dashboard-subtitle">
                Everything you need to manage your online presence.
              </p>
            </div>
          </div>

          <button className="dashboard-logout" onClick={onLogout}>
            <span>↪</span>
            Logout
          </button>
        </header>

        {/* ==================================================
            QUICK OVERVIEW
           ================================================== */}

        <section className="dashboard-summary">
          <div className="summary-card summary-website">
            <div className="summary-card-top">
              <div className="summary-icon">🌐</div>

              <span className="summary-status">Live</span>
            </div>

            <div className="summary-value">Website</div>

            <div className="summary-label">Your online presence</div>
          </div>

          <div className="summary-card">
            <div className="summary-card-top">
              <div className="summary-icon blue">📩</div>
            </div>

            <div className="summary-value">{enquiryCounts.total}</div>

            <div className="summary-label">Total enquiries</div>
          </div>

          <div className="summary-card">
            <div className="summary-card-top">
              <div className="summary-icon orange">🔵</div>
            </div>

            <div className="summary-value">{enquiryCounts.new}</div>

            <div className="summary-label">New enquiries</div>
          </div>

          <div className="summary-card">
            <div className="summary-card-top">
              <div className="summary-icon green">✓</div>
            </div>

            <div className="summary-value">{enquiryCounts.completed}</div>

            <div className="summary-label">Completed</div>
          </div>
        </section>

        {/* ==================================================
            WEBSITE
           ================================================== */}

        <section className="website-card">
          <div className="website-card-header">
            <div className="website-card-heading">
              <div className="website-icon">🌐</div>

              <div className="website-title-area">
                <p className="card-label">YOUR WEBSITE</p>

                <h2>{businessName || "Your Business Website"}</h2>

                <p className="website-description">
                  Manage your website content and appearance.
                </p>
              </div>
            </div>

            <span className="website-status">
              <span className="status-dot" />
              Ready
            </span>
          </div>

          <div className="website-divider" />

          <div className="website-info-grid">
            <div className="website-info-item">
              <span>Theme</span>
              <strong>{website?.theme || "Blue"}</strong>
            </div>

            <div className="website-info-item">
              <span>Services</span>
              <strong>
                {Array.isArray(website?.services) ? website.services.length : 0}
              </strong>
            </div>

            <div className="website-info-item">
              <span>Website ID</span>
              <strong>{website?.id || "-"}</strong>
            </div>
          </div>

          <button className="dashboard-edit-button" onClick={onEditWebsite}>
            <span>✏️</span>
            <span>Edit Website</span>
            <span className="edit-arrow">→</span>
          </button>
        </section>

        {/* ==================================================
            CUSTOMER ENQUIRIES
           ================================================== */}

        <section className="enquiries-card">
          <div className="enquiries-header">
            <div>
              <p className="card-label">CUSTOMER ENQUIRIES</p>

              <h2>Customer enquiries</h2>

              <p className="enquiries-subtitle">
                Keep track of customers who contacted you.
              </p>
            </div>

            <div className="enquiries-count">
              <strong>{enquiryCounts.total}</strong>

              <span>Total</span>
            </div>
          </div>

          {/* ==================================================
              FILTERS
             ================================================== */}

          <div className="enquiry-filters">
            <button
              className={
                enquiryFilter === "all"
                  ? "enquiry-filter active"
                  : "enquiry-filter"
              }
              onClick={() => changeEnquiryFilter("all")}
            >
              All
              <span>{enquiryCounts.total}</span>
            </button>

            <button
              className={
                enquiryFilter === "new"
                  ? "enquiry-filter active"
                  : "enquiry-filter"
              }
              onClick={() => changeEnquiryFilter("new")}
            >
              New
              <span>{enquiryCounts.new}</span>
            </button>

            <button
              className={
                enquiryFilter === "contacted"
                  ? "enquiry-filter active"
                  : "enquiry-filter"
              }
              onClick={() => changeEnquiryFilter("contacted")}
            >
              Contacted
              <span>{enquiryCounts.contacted}</span>
            </button>

            <button
              className={
                enquiryFilter === "completed"
                  ? "enquiry-filter active"
                  : "enquiry-filter"
              }
              onClick={() => changeEnquiryFilter("completed")}
            >
              Completed
              <span>{enquiryCounts.completed}</span>
            </button>
          </div>

          {/* ==================================================
              SUMMARY
             ================================================== */}

          {!enquiriesLoading && (
            <div className="enquiries-summary">
              <span>
                <b className="summary-dot new-dot" />
                {enquiryCounts.new} new
              </span>

              <span>
                <b className="summary-dot contacted-dot" />
                {enquiryCounts.contacted} contacted
              </span>

              <span>
                <b className="summary-dot completed-dot" />
                {enquiryCounts.completed} completed
              </span>
            </div>
          )}

          {/* ==================================================
              LOADING
             ================================================== */}

          {enquiriesLoading && (
            <div className="enquiries-empty">
              <div className="enquiry-loading-spinner" />

              <p>Loading customer enquiries...</p>
            </div>
          )}

          {/* ==================================================
              ERROR
             ================================================== */}

          {!enquiriesLoading && enquiriesError && (
            <div className="enquiries-error">
              <span>⚠️</span>

              <div>
                <strong>Unable to load enquiries</strong>

                <p>{enquiriesError}</p>
              </div>
            </div>
          )}

          {/* ==================================================
              EMPTY
             ================================================== */}

          {!enquiriesLoading && !enquiriesError && enquiries.length === 0 && (
            <div className="enquiries-empty">
              <div className="enquiries-empty-icon">📭</div>

              <h3>
                {enquiryFilter === "all"
                  ? "No customer enquiries yet"
                  : `No ${getStatusLabel(
                      enquiryFilter,
                    ).toLowerCase()} enquiries`}
              </h3>

              <p>
                {enquiryFilter === "all"
                  ? "When customers submit the enquiry form on your website, their requests will appear here."
                  : "There are currently no enquiries with this status."}
              </p>
            </div>
          )}

          {/* ==================================================
              ENQUIRY LIST
             ================================================== */}

          {!enquiriesLoading && !enquiriesError && enquiries.length > 0 && (
            <div className="enquiries-list">
              {enquiries.map((enquiry) => (
                <div className="enquiry-item" key={enquiry.id}>
                  {/* CUSTOMER HEADER */}

                  <div className="enquiry-main">
                    <div className="enquiry-customer">
                      <div className="enquiry-avatar">
                        {String(enquiry.customerName || "C")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h3>{enquiry.customerName || "Customer"}</h3>

                        <a
                          href={`tel:${enquiry.phone}`}
                          className="enquiry-phone"
                        >
                          📞 {enquiry.phone}
                        </a>
                      </div>
                    </div>

                    {/* STATUS */}

                    <div className="enquiry-status-control">
                      <span className={getStatusClass(enquiry.status)}>
                        {getStatusLabel(enquiry.status)}
                      </span>

                      <select
                        value={String(enquiry.status || "new").toLowerCase()}
                        onChange={(event) =>
                          updateEnquiryStatus(enquiry.id, event.target.value)
                        }
                        className="enquiry-status-select"
                      >
                        <option value="new">New</option>

                        <option value="contacted">Contacted</option>

                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {/* DETAILS */}

                  <div className="enquiry-details">
                    {enquiry.service && (
                      <div className="enquiry-detail">
                        <span>🛠️</span>

                        <div>
                          <small>Service</small>

                          <strong>{enquiry.service}</strong>
                        </div>
                      </div>
                    )}

                    {enquiry.vehicle && (
                      <div className="enquiry-detail">
                        <span>🚗</span>

                        <div>
                          <small>Vehicle</small>

                          <strong>{enquiry.vehicle}</strong>
                        </div>
                      </div>
                    )}

                    {enquiry.preferredDate && (
                      <div className="enquiry-detail">
                        <span>📅</span>

                        <div>
                          <small>Preferred Date</small>

                          <strong>{formatDate(enquiry.preferredDate)}</strong>
                        </div>
                      </div>
                    )}

                    {enquiry.message && (
                      <div className="enquiry-message">
                        <small>Message</small>

                        <p>{enquiry.message}</p>
                      </div>
                    )}
                  </div>

                  {/* FOOTER */}

                  <div className="enquiry-footer">
                    <span>Received {formatDate(enquiry.createdAt)}</span>

                    <a
                      href={`tel:${enquiry.phone}`}
                      className="enquiry-contact-button"
                    >
                      📞 Contact Customer
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ==================================================
              LOAD MORE
             ================================================== */}

          {!enquiriesLoading &&
            !enquiriesError &&
            enquiries.length > 0 &&
            hasMoreEnquiries && (
              <div className="enquiries-load-more">
                <button
                  className="load-more-button"
                  onClick={loadMoreEnquiries}
                  disabled={enquiriesLoadingMore}
                >
                  {enquiriesLoadingMore ? "Loading..." : "Load More Enquiries"}
                </button>
              </div>
            )}
        </section>

        {/* ==================================================
            FOOTER
           ================================================== */}

        <footer className="dashboard-footer">
          <div className="footer-brand">
            <span className="footer-brand-icon">✦</span>

            <strong>SiteCraft</strong>
          </div>

          <span>Simple websites. Powerful presence.</span>
        </footer>
      </div>
    </div>
  );
}

export default Dashboard;
