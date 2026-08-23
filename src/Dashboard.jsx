import { useEffect, useState } from "react";
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronRight,
  Globe2,
  LogOut,
  MessageSquare,
  Pencil,
  Phone,
  Users,
  Wrench,
} from "lucide-react";

import "./Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const RECENT_ENQUIRIES_LIMIT = 3;
const ENQUIRIES_PER_PAGE = 10;

function Dashboard({ user, website, token, onEditWebsite, onLogout }) {
  const businessName = website?.businessName?.trim() || "Your Business";

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

  const [showAllEnquiries, setShowAllEnquiries] = useState(false);

  // ==================================================
  // LOAD ENQUIRIES
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
    setShowAllEnquiries(false);

    loadEnquiries({
      status: enquiryFilter,
      offset: 0,
      append: false,
    });
  }, [token, enquiryFilter]);

  // ==================================================
  // FILTER
  // ==================================================

  const changeEnquiryFilter = (newFilter) => {
    if (newFilter === enquiryFilter) {
      return;
    }

    setEnquiryFilter(newFilter);
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
    });
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
  // DATE FORMAT
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
  // STATUS
  // ==================================================

  const getStatusClass = (status) => {
    const normalizedStatus = String(status || "new").toLowerCase();

    if (normalizedStatus === "completed") {
      return "status-badge status-completed";
    }

    if (normalizedStatus === "contacted") {
      return "status-badge status-contacted";
    }

    return "status-badge status-new";
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
  // VISIBLE ENQUIRIES
  // ==================================================

  const visibleEnquiries = showAllEnquiries
    ? enquiries
    : enquiries.slice(0, RECENT_ENQUIRIES_LIMIT);

  // ==================================================
  // DASHBOARD
  // ==================================================

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* ==========================================
            HEADER
           ========================================== */}

        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <div className="dashboard-brand-row">
              <div className="dashboard-brand-icon">
                <Globe2 size={17} strokeWidth={2.2} />
              </div>

              <span>SiteCraft</span>
            </div>

            <h1>Welcome back, {user?.name || "there"}</h1>

            <p className="dashboard-subtitle">
              Here's an overview of your website and customer activity.
            </p>
          </div>

          <button className="dashboard-logout" onClick={onLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </header>

        {/* ==========================================
            WEBSITE OVERVIEW
           ========================================== */}

        <section className="website-card">
          <div className="website-card-top">
            <div className="website-title-group">
              <div className="website-icon">
                <Globe2 size={21} strokeWidth={2} />
              </div>

              <div>
                <span className="section-eyebrow">YOUR WEBSITE</span>

                <h2>{businessName}</h2>

                <p>Your business website is ready to customize.</p>
              </div>
            </div>

            <span className="website-status">
              <CheckCircle2 size={14} />
              Published
            </span>
          </div>

          <div className="website-divider" />

          <div className="website-stats">
            <div className="website-stat">
              <span>Theme</span>
              <strong>{website?.theme || "Default"}</strong>
            </div>

            <div className="website-stat">
              <span>Services</span>
              <strong>
                {Array.isArray(website?.services) ? website.services.length : 0}
              </strong>
            </div>

            <div className="website-stat">
              <span>Website ID</span>
              <strong>{website?.id || "-"}</strong>
            </div>
          </div>

          <button className="customize-button" onClick={onEditWebsite}>
            <Pencil size={16} />
            <span>Customize Website</span>
            <ChevronRight size={17} className="customize-arrow" />
          </button>
        </section>

        {/* ==========================================
            CUSTOMER ACTIVITY
           ========================================== */}

        <section className="activity-section">
          <div className="activity-header">
            <div>
              <span className="section-eyebrow">CUSTOMER ACTIVITY</span>

              <h2>Enquiries</h2>

              <p>Keep track of requests from your website visitors.</p>
            </div>

            <div className="activity-total">
              <strong>{enquiryCounts.total}</strong>

              <span>Total</span>
            </div>
          </div>

          {/* ========================================
              SUMMARY STATS
             ======================================== */}

          <div className="enquiry-stats">
            <button
              className={`enquiry-stat-card ${
                enquiryFilter === "all" ? "active" : ""
              }`}
              onClick={() => changeEnquiryFilter("all")}
            >
              <div className="stat-icon stat-icon-total">
                <MessageSquare size={17} />
              </div>

              <div>
                <strong>{enquiryCounts.total}</strong>

                <span>Total enquiries</span>
              </div>
            </button>

            <button
              className={`enquiry-stat-card ${
                enquiryFilter === "new" ? "active" : ""
              }`}
              onClick={() => changeEnquiryFilter("new")}
            >
              <div className="stat-icon stat-icon-new">
                <MessageSquare size={17} />
              </div>

              <div>
                <strong>{enquiryCounts.new}</strong>

                <span>New</span>
              </div>
            </button>

            <button
              className={`enquiry-stat-card ${
                enquiryFilter === "contacted" ? "active" : ""
              }`}
              onClick={() => changeEnquiryFilter("contacted")}
            >
              <div className="stat-icon stat-icon-contacted">
                <Phone size={17} />
              </div>

              <div>
                <strong>{enquiryCounts.contacted}</strong>

                <span>Contacted</span>
              </div>
            </button>

            <button
              className={`enquiry-stat-card ${
                enquiryFilter === "completed" ? "active" : ""
              }`}
              onClick={() => changeEnquiryFilter("completed")}
            >
              <div className="stat-icon stat-icon-completed">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <strong>{enquiryCounts.completed}</strong>

                <span>Completed</span>
              </div>
            </button>
          </div>

          {/* ========================================
              LOADING
             ======================================== */}

          {enquiriesLoading && (
            <div className="enquiries-state">
              <div className="enquiry-loading-spinner" />
              <p>Loading enquiries...</p>
            </div>
          )}

          {/* ========================================
              ERROR
             ======================================== */}

          {!enquiriesLoading && enquiriesError && (
            <div className="enquiries-error">
              <MessageSquare size={19} />

              <div>
                <strong>Unable to load enquiries</strong>

                <p>{enquiriesError}</p>
              </div>
            </div>
          )}

          {/* ========================================
              EMPTY
             ======================================== */}

          {!enquiriesLoading && !enquiriesError && enquiries.length === 0 && (
            <div className="enquiries-state">
              <div className="empty-icon">
                <MessageSquare size={25} />
              </div>

              <h3>
                {enquiryFilter === "all"
                  ? "No enquiries yet"
                  : `No ${getStatusLabel(
                      enquiryFilter,
                    ).toLowerCase()} enquiries`}
              </h3>

              <p>
                {enquiryFilter === "all"
                  ? "Customer requests submitted through your website will appear here."
                  : "There are currently no enquiries with this status."}
              </p>
            </div>
          )}

          {/* ========================================
              RECENT ENQUIRIES
             ======================================== */}

          {!enquiriesLoading && !enquiriesError && enquiries.length > 0 && (
            <>
              <div className="recent-header">
                <div>
                  <h3>
                    {showAllEnquiries ? "All enquiries" : "Recent enquiries"}
                  </h3>

                  {!showAllEnquiries && enquiries.length > 3 && (
                    <span>Showing the latest 3</span>
                  )}
                </div>

                {enquiries.length > 3 && (
                  <button
                    className="view-all-button"
                    onClick={() => setShowAllEnquiries((current) => !current)}
                  >
                    {showAllEnquiries ? "Show recent" : "View all enquiries"}

                    <ChevronRight
                      size={15}
                      className={showAllEnquiries ? "rotate-left" : ""}
                    />
                  </button>
                )}
              </div>

              <div className="enquiries-list">
                {visibleEnquiries.map((enquiry) => (
                  <div className="enquiry-item" key={enquiry.id}>
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
                            <Phone size={13} />
                            {enquiry.phone}
                          </a>
                        </div>
                      </div>

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

                    <div className="enquiry-details">
                      {enquiry.service && (
                        <div className="enquiry-detail">
                          <Wrench size={16} />

                          <div>
                            <small>Service</small>

                            <strong>{enquiry.service}</strong>
                          </div>
                        </div>
                      )}

                      {enquiry.vehicle && (
                        <div className="enquiry-detail">
                          <CarFront size={16} />

                          <div>
                            <small>Vehicle</small>

                            <strong>{enquiry.vehicle}</strong>
                          </div>
                        </div>
                      )}

                      {enquiry.preferredDate && (
                        <div className="enquiry-detail">
                          <CalendarDays size={16} />

                          <div>
                            <small>Preferred date</small>

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

                    <div className="enquiry-footer">
                      <span>Received {formatDate(enquiry.createdAt)}</span>

                      <a
                        href={`tel:${enquiry.phone}`}
                        className="enquiry-contact-button"
                      >
                        <Phone size={14} />
                        Contact
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* ==================================
                    LOAD MORE
                   ================================== */}

              {showAllEnquiries && hasMoreEnquiries && (
                <div className="enquiries-load-more">
                  <button
                    className="load-more-button"
                    onClick={loadMoreEnquiries}
                    disabled={enquiriesLoadingMore}
                  >
                    {enquiriesLoadingMore
                      ? "Loading..."
                      : "Load more enquiries"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ==========================================
            FOOTER
           ========================================== */}

        <footer className="dashboard-footer">
          <span>SiteCraft</span>
          <span>•</span>
          <span>Business Website Platform</span>
        </footer>
      </div>
    </div>
  );
}

export default Dashboard;
