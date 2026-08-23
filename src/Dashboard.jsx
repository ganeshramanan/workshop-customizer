import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Globe2,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Phone,
  UserRound,
  Users,
  Wrench,
  Car,
  CalendarDays,
  Mail,
} from "lucide-react";

import "./Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Dashboard({ user, website, token, onEditWebsite, onLogout }) {
  const businessName = website?.businessName?.trim() || "Your Website";

  // ==================================================
  // ENQUIRY STATE
  // ==================================================

  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(true);
  const [enquiriesLoadingMore, setEnquiriesLoadingMore] = useState(false);
  const [enquiriesError, setEnquiriesError] = useState("");

  const [enquiryFilter, setEnquiryFilter] = useState("all");

  const [expandedEnquiry, setExpandedEnquiry] = useState(null);

  const [enquiryCounts, setEnquiryCounts] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    completed: 0,
  });

  const [hasMoreEnquiries, setHasMoreEnquiries] = useState(false);

  const ENQUIRIES_PER_PAGE = 10;

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
        throw new Error(result.message || "Failed to load enquiries");
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
  // INITIAL LOAD / FILTER
  // ==================================================

  useEffect(() => {
    if (!token) {
      setEnquiriesLoading(false);
      return;
    }

    setEnquiries([]);
    setExpandedEnquiry(null);

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

  const getStatusClass = (status) => {
    const normalized = String(status || "new").toLowerCase();

    if (normalized === "completed") {
      return "status-badge completed";
    }

    if (normalized === "contacted") {
      return "status-badge contacted";
    }

    return "status-badge new";
  };

  const getStatusIcon = (status) => {
    const normalized = String(status || "new").toLowerCase();

    if (normalized === "completed") {
      return <CheckCircle2 size={14} />;
    }

    if (normalized === "contacted") {
      return <Phone size={14} />;
    }

    return <Clock3 size={14} />;
  };

  const toggleEnquiry = (id) => {
    setExpandedEnquiry((current) => (current === id ? null : id));
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* ==================================================
            TOP NAVIGATION
           ================================================== */}

        <header className="dashboard-topbar">
          <div className="brand-area">
            <div className="brand-mark">
              <LayoutDashboard size={20} />
            </div>

            <div>
              <div className="brand-name">SiteCraft</div>

              <div className="brand-caption">Business website platform</div>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="user-profile">
              <div className="user-avatar">
                <UserRound size={17} />
              </div>

              <div className="user-profile-text">
                <strong>{user?.name || "Account"}</strong>

                <span>{user?.email || "Business owner"}</span>
              </div>
            </div>

            <button className="logout-button" onClick={onLogout} title="Logout">
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* ==================================================
            WELCOME
           ================================================== */}

        <section className="welcome-section">
          <div>
            <div className="section-kicker">DASHBOARD</div>

            <h1>Welcome back, {user?.name || "there"}</h1>

            <p>Manage your website and stay on top of customer enquiries.</p>
          </div>
        </section>

        {/* ==================================================
            WEBSITE HERO
           ================================================== */}

        <section className="website-hero">
          <div className="website-hero-main">
            <div className="website-logo">
              <Globe2 size={25} />
            </div>

            <div className="website-hero-content">
              <div className="website-label">YOUR WEBSITE</div>

              <h2>{businessName}</h2>

              <div className="website-meta">
                <span className="ready-indicator">
                  <span className="ready-dot" />
                  Website ready
                </span>

                <span className="meta-divider">•</span>

                <span>
                  {Array.isArray(website?.services)
                    ? website.services.length
                    : 0}{" "}
                  services
                </span>

                <span className="meta-divider">•</span>

                <span>{website?.theme || "Default"} theme</span>
              </div>
            </div>
          </div>

          <button className="website-edit-button" onClick={onEditWebsite}>
            Edit website
            <ArrowRight size={16} />
          </button>
        </section>

        {/* ==================================================
            STATISTICS
           ================================================== */}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <MessageSquare size={18} />
            </div>

            <div>
              <span>Total enquiries</span>
              <strong>{enquiryCounts.total}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon new">
              <Clock3 size={18} />
            </div>

            <div>
              <span>New</span>
              <strong>{enquiryCounts.new}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon contacted">
              <Phone size={18} />
            </div>

            <div>
              <span>Contacted</span>
              <strong>{enquiryCounts.contacted}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon completed">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <span>Completed</span>
              <strong>{enquiryCounts.completed}</strong>
            </div>
          </div>
        </section>

        {/* ==================================================
            ENQUIRIES
           ================================================== */}

        <section className="enquiries-section">
          <div className="enquiries-section-header">
            <div>
              <div className="section-kicker">CUSTOMER ACTIVITY</div>

              <h2>Recent enquiries</h2>

              <p>Review and manage requests from your website.</p>
            </div>

            <div className="enquiries-total">
              <Users size={16} />
              <span>{enquiryCounts.total} total</span>
            </div>
          </div>

          {/* FILTERS */}

          <div className="enquiry-filter-bar">
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
                    ? "filter-button active"
                    : "filter-button"
                }
                onClick={() => setEnquiryFilter(value)}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>

          {/* LOADING */}

          {enquiriesLoading && (
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <span>Loading enquiries...</span>
            </div>
          )}

          {/* ERROR */}

          {!enquiriesLoading && enquiriesError && (
            <div className="dashboard-error">
              <MessageSquare size={20} />

              <div>
                <strong>Unable to load enquiries</strong>

                <p>{enquiriesError}</p>
              </div>
            </div>
          )}

          {/* EMPTY */}

          {!enquiriesLoading && !enquiriesError && enquiries.length === 0 && (
            <div className="dashboard-empty">
              <div className="empty-icon">
                <MessageSquare size={24} />
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

          {/* ENQUIRY LIST */}

          {!enquiriesLoading && !enquiriesError && enquiries.length > 0 && (
            <div className="enquiry-table">
              <div className="enquiry-table-header">
                <span>Customer</span>
                <span>Request</span>
                <span>Status</span>
                <span />
              </div>

              {enquiries.map((enquiry) => {
                const isExpanded = expandedEnquiry === enquiry.id;

                return (
                  <div
                    className={
                      isExpanded
                        ? "enquiry-row-wrapper expanded"
                        : "enquiry-row-wrapper"
                    }
                    key={enquiry.id}
                  >
                    {/* COMPACT ROW */}

                    <div className="enquiry-row">
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          {String(enquiry.customerName || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="customer-info">
                          <strong>{enquiry.customerName || "Customer"}</strong>

                          <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>
                        </div>
                      </div>

                      <div className="request-cell">
                        <strong>{enquiry.service || "General enquiry"}</strong>

                        {enquiry.vehicle && <span>{enquiry.vehicle}</span>}
                      </div>

                      <div className="status-cell">
                        <div className="status-control">
                          <span className={getStatusClass(enquiry.status)}>
                            {getStatusIcon(enquiry.status)}

                            {getStatusLabel(enquiry.status)}
                          </span>

                          <select
                            value={String(
                              enquiry.status || "new",
                            ).toLowerCase()}
                            onChange={(event) =>
                              updateEnquiryStatus(
                                enquiry.id,
                                event.target.value,
                              )
                            }
                          >
                            <option value="new">New</option>

                            <option value="contacted">Contacted</option>

                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      <button
                        className="expand-button"
                        onClick={() => toggleEnquiry(enquiry.id)}
                        aria-label={
                          isExpanded ? "Collapse enquiry" : "View enquiry"
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>

                    {/* EXPANDED DETAILS */}

                    {isExpanded && (
                      <div className="enquiry-expanded">
                        <div className="expanded-grid">
                          {enquiry.service && (
                            <div className="expanded-detail">
                              <Wrench size={16} />

                              <div>
                                <span>Service</span>

                                <strong>{enquiry.service}</strong>
                              </div>
                            </div>
                          )}

                          {enquiry.vehicle && (
                            <div className="expanded-detail">
                              <Car size={16} />

                              <div>
                                <span>Vehicle</span>

                                <strong>{enquiry.vehicle}</strong>
                              </div>
                            </div>
                          )}

                          {enquiry.preferredDate && (
                            <div className="expanded-detail">
                              <CalendarDays size={16} />

                              <div>
                                <span>Preferred date</span>

                                <strong>
                                  {formatDate(enquiry.preferredDate)}
                                </strong>
                              </div>
                            </div>
                          )}

                          <div className="expanded-detail">
                            <Mail size={16} />

                            <div>
                              <span>Received</span>

                              <strong>{formatDate(enquiry.createdAt)}</strong>
                            </div>
                          </div>
                        </div>

                        {enquiry.message && (
                          <div className="expanded-message">
                            <span>Customer message</span>

                            <p>{enquiry.message}</p>
                          </div>
                        )}

                        <div className="expanded-actions">
                          <a
                            href={`tel:${enquiry.phone}`}
                            className="contact-customer-button"
                          >
                            <Phone size={16} />
                            Contact customer
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* LOAD MORE */}

          {!enquiriesLoading &&
            !enquiriesError &&
            enquiries.length > 0 &&
            hasMoreEnquiries && (
              <div className="load-more-container">
                <button
                  className="load-more-button"
                  onClick={loadMoreEnquiries}
                  disabled={enquiriesLoadingMore}
                >
                  {enquiriesLoadingMore ? "Loading..." : "Load more enquiries"}

                  <ChevronDown size={16} />
                </button>
              </div>
            )}
        </section>

        {/* ==================================================
            FOOTER
           ================================================== */}

        <footer className="dashboard-footer">
          <span className="footer-brand">SiteCraft</span>

          <span>Business website platform</span>

          <span className="footer-dot">•</span>

          <span>Dashboard</span>
        </footer>
      </div>
    </div>
  );
}

export default Dashboard;
