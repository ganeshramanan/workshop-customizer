import React from "react";
import "./PublicWebsite.css";

function WebsiteRenderer({
  website,
  businessName,
  phone,
  about,
  heroTitle,
  heroSubTitle,
  heroBadge,
  logo,
  theme,
  address,
  whatsapp,
  hours,
  services = [],
  gallery = [],
  logoUrl,
  phoneNumber,
  whatsappNumber,
  activeSection,
  scrollToSection,
  booking,
  bookingStatus,
  handleBookingChange,
  handleBookingSubmit,

  // Analytics handlers
  handleWhatsAppClick,
  handlePhoneClick,
  handleDirectionClick,
}) {
  // ==================================================
  // SAFE DATA
  // ==================================================

  const safeServices = Array.isArray(services) ? services : [];

  const safeGallery = Array.isArray(gallery)
    ? gallery
    : Array.isArray(website?.gallery)
      ? website.gallery
      : [];

  // ==================================================
  // DISPLAY DATA
  // ==================================================

  const displayLogo = logoUrl || logo || null;

  const displayPhone = phoneNumber || phone || "";

  const displayWhatsapp = whatsappNumber || whatsapp || "";

  // ==================================================
  // GOOGLE MAPS URL
  // ==================================================

  const directionsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address,
      )}`
    : "";

  return (
    <div className={`public-site ${theme || "blue"}`}>
      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="public-header">
        <div className="public-container header-inner">
          <button
            type="button"
            className="public-brand"
            onClick={() => scrollToSection("home")}
            aria-label={`Go to ${businessName} home`}
          >
            {displayLogo ? (
              <img
                className="public-logo"
                src={displayLogo}
                alt={`${businessName} logo`}
              />
            ) : (
              <div className="brand-placeholder">🏢</div>
            )}

            <div>
              <strong>{businessName}</strong>

              <span>Welcome to {businessName}</span>
            </div>
          </button>

          <nav className="public-nav" aria-label="Main navigation">
            <button
              type="button"
              className={activeSection === "home" ? "nav-active" : ""}
              onClick={() => scrollToSection("home")}
            >
              Home
            </button>

            <button
              type="button"
              className={activeSection === "services" ? "nav-active" : ""}
              onClick={() => scrollToSection("services")}
            >
              Services
            </button>

            {/* ==================================================
                GALLERY NAVIGATION
            ================================================== */}

            {safeGallery.length > 0 && (
              <button
                type="button"
                className={activeSection === "gallery" ? "nav-active" : ""}
                onClick={() => scrollToSection("gallery")}
              >
                Gallery
              </button>
            )}

            <button
              type="button"
              className={activeSection === "book" ? "nav-active" : ""}
              onClick={() => scrollToSection("book")}
            >
              Enquiry Form
            </button>

            <button
              type="button"
              className={activeSection === "about" ? "nav-active" : ""}
              onClick={() => scrollToSection("about")}
            >
              About
            </button>

            <button
              type="button"
              className={activeSection === "contact" ? "nav-active" : ""}
              onClick={() => scrollToSection("contact")}
            >
              Contact
            </button>
          </nav>

          <div className="header-actions">
            {/* ==================================================
                PHONE
            ================================================== */}

            {displayPhone && (
              <a
                className="header-call"
                href={`tel:${displayPhone}`}
                onClick={handlePhoneClick}
              >
                Call
              </a>
            )}

            {/* ==================================================
                WHATSAPP
            ================================================== */}

            {displayWhatsapp && (
              <a
                className="header-whatsapp"
                href={`https://wa.me/${displayWhatsapp}`}
                target="_blank"
                rel="noreferrer"
                onClick={handleWhatsAppClick}
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ==================================================
          HERO
      ================================================== */}

      <section id="home" className="hero-section">
        <div className="public-container hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span>✓</span>

              {heroBadge || "Welcome"}
            </div>

            <h1>
              {heroTitle || businessName || "Your Business"}

              <br />

              <span>{heroSubTitle || "Quality you can trust."}</span>
            </h1>

            <p className="hero-description">
              {about ||
                `${businessName} is here to provide quality products and services with a focus on customer satisfaction.`}
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="hero-primary-button"
                onClick={() => scrollToSection("book")}
              >
                Enquire Now
              </button>

              <button
                type="button"
                className="hero-secondary-button"
                onClick={() => scrollToSection("services")}
              >
                View Services
              </button>
            </div>

            <div className="hero-trust">
              <span>✓ Quality service</span>

              <span>✓ Professional approach</span>

              <span>✓ Customer focused</span>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-icon">✨</div>

            <h3>We're here to help.</h3>

            <p>
              Discover our services and get in touch with us to learn more about
              what {businessName} can offer you.
            </p>

            <button
              type="button"
              className="hero-card-button"
              onClick={() => scrollToSection("book")}
            >
              Enquire now →
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          SERVICES
      ================================================== */}

      <section id="services" className="services-section">
        <div className="public-container">
          <div className="section-heading">
            <span>WHAT WE OFFER</span>

            <h2>Our Services</h2>

            <p>Explore the services offered by {businessName}.</p>
          </div>

          <div className="service-grid">
            {safeServices.length > 0 ? (
              safeServices.map((service, index) => (
                <div className="service-card" key={`service-${index}`}>
                  <div className="service-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="service-icon">✓</div>

                  <h3>{service}</h3>

                  <p>
                    Quality {String(service).toLowerCase()} with attention to
                    detail and customer satisfaction.
                  </p>
                </div>
              ))
            ) : (
              <div className="empty-services">
                <p>Services will be listed here soon.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          GALLERY
      ================================================== */}

      <section id="gallery" className="gallery-section">
        <div className="public-container">
          <div className="section-heading">
            <span>OUR WORK</span>

            <h2>Gallery</h2>

            <p>Take a look at some photos from {businessName}.</p>
          </div>

          {safeGallery.length > 0 ? (
            <div
              className="gallery-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
                marginTop: "30px",
              }}
            >
              {safeGallery.map((image, index) => {
                const imageUrl = image.url || image.imageUrl || image.image_url;

                const imageName =
                  image.name ||
                  image.fileName ||
                  image.file_name ||
                  `Gallery image ${index + 1}`;

                if (!imageUrl) {
                  return null;
                }

                return (
                  <div
                    className="gallery-item"
                    key={image.id || `gallery-${index}`}
                    style={{
                      borderRadius: "14px",
                      overflow: "hidden",
                      background: "#f5f5f5",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={imageName}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "220px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="empty-gallery"
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#888",
              }}
            >
              <p>No gallery photos added yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
          INQUIRY FORM
      ================================================== */}

      <section id="book" className="service-request-section">
        <div className="service-request-card">
          <div className="section-heading">
            <span>GET IN TOUCH</span>

            <h2>How can we help?</h2>

            <p>Tell us what you need and we'll get back to you.</p>
          </div>

          <form onSubmit={handleBookingSubmit}>
            <div className="form-grid">
              {/* NAME */}

              <div className="form-group">
                <label htmlFor="booking-name">Your Name</label>

                <input
                  id="booking-name"
                  name="name"
                  type="text"
                  value={booking.name}
                  onChange={handleBookingChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* PHONE */}

              <div className="form-group">
                <label htmlFor="booking-phone">Phone Number</label>

                <input
                  id="booking-phone"
                  name="phone"
                  type="tel"
                  value={booking.phone}
                  onChange={handleBookingChange}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              {/* SERVICE */}

              <div className="form-group form-group-full">
                <label htmlFor="booking-service">Service / Requirement</label>

                <input
                  id="booking-service"
                  name="service"
                  type="text"
                  value={booking.service}
                  onChange={handleBookingChange}
                  placeholder="What do you need help with?"
                  required
                />
              </div>

              {/* MESSAGE */}

              <div className="form-group form-group-full">
                <label htmlFor="booking-message">Message</label>

                <textarea
                  id="booking-message"
                  name="notes"
                  rows="4"
                  value={booking.notes}
                  onChange={handleBookingChange}
                  placeholder="Tell us anything else you'd like us to know..."
                />
              </div>
            </div>

            <div className="form-submit-container">
              <button type="submit" className="service-request-button">
                💬 Send Enquiry
              </button>
            </div>

            {bookingStatus && (
              <div
                className={
                  bookingStatus.includes("successfully")
                    ? "form-success"
                    : "form-error"
                }
              >
                {bookingStatus}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* ==================================================
          ABOUT
      ================================================== */}

      <section id="about" className="about-section">
        <div className="public-container about-grid">
          <div className="about-visual">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt={`${businessName} logo`}
                style={{
                  maxWidth: "55%",
                  maxHeight: "55%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div className="about-icon">🏢</div>
            )}

            <div className="about-floating-card">
              <strong>{businessName}</strong>

              <span>Quality you can trust</span>
            </div>
          </div>

          <div className="about-content">
            <span className="section-label">ABOUT US</span>

            <h2>Built around our customers.</h2>

            <p>
              {about ||
                `${businessName} is committed to providing quality service and a positive customer experience.`}
            </p>

            <div className="about-points">
              <div>
                <span>✓</span>

                <p>Quality service</p>
              </div>

              <div>
                <span>✓</span>

                <p>Professional approach</p>
              </div>

              <div>
                <span>✓</span>

                <p>Customer-first approach</p>
              </div>

              <div>
                <span>✓</span>

                <p>Easy to get in touch</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          CONTACT
      ================================================== */}

      <section id="contact" className="contact-section">
        <div className="public-container">
          <div className="section-heading light">
            <span>GET IN TOUCH</span>

            <h2>Contact {businessName}</h2>

            <p>
              Have a question or need more information? We're happy to help.
            </p>
          </div>

          <div className="contact-grid">
            {/* ==================================================
                DIRECTIONS
            ================================================== */}

            {address && (
              <a
                className="contact-card"
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                onClick={handleDirectionClick}
              >
                <div className="contact-icon">📍</div>

                <div>
                  <span>ADDRESS</span>

                  <strong>{address}</strong>
                </div>
              </a>
            )}

            {/* ==================================================
                PHONE
            ================================================== */}

            {displayPhone && (
              <a
                className="contact-card"
                href={`tel:${displayPhone}`}
                onClick={handlePhoneClick}
              >
                <div className="contact-icon">📞</div>

                <div>
                  <span>PHONE</span>

                  <strong>{displayPhone}</strong>
                </div>
              </a>
            )}

            {/* ==================================================
                OPENING HOURS
            ================================================== */}

            {hours && (
              <div className="contact-card">
                <div className="contact-icon">🕒</div>

                <div>
                  <span>OPENING HOURS</span>

                  <strong>{hours}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="public-footer">
        <div className="public-container footer-inner">
          <div>
            <strong>{businessName}</strong>

            <p>Quality service. Customer focused.</p>
          </div>

          <p>
            © {new Date().getFullYear()} {businessName}
          </p>
        </div>
      </footer>

      {/* ==================================================
          MOBILE CONTACT BAR
      ================================================== */}

      {(displayPhone || displayWhatsapp) && (
        <div className="mobile-contact-bar">
          {displayPhone && (
            <a
              className="mobile-call"
              href={`tel:${displayPhone}`}
              onClick={handlePhoneClick}
            >
              📞 Call
            </a>
          )}

          {displayWhatsapp && (
            <a
              className="mobile-wa"
              href={`https://wa.me/${displayWhatsapp}`}
              target="_blank"
              rel="noreferrer"
              onClick={handleWhatsAppClick}
            >
              💬 WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default WebsiteRenderer;
