import React, { useState } from "react";
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
  handleWhatsAppClick,
  handlePhoneClick,
  handleDirectionClick,
}) {
  const safeServices = Array.isArray(services) ? services : [];

  const safeGallery = Array.isArray(gallery)
    ? gallery
    : Array.isArray(website?.gallery)
      ? website.gallery
      : [];

  // ==================================================
  // GALLERY LIGHTBOX
  // ==================================================

  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);

  const openGalleryImage = (image) => {
    setSelectedGalleryImage(image);
  };

  const closeGalleryImage = () => {
    setSelectedGalleryImage(null);
  };

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
            {displayPhone && (
              <a
                className="header-call"
                href={`tel:${displayPhone}`}
                onClick={handlePhoneClick}
              >
                Call
              </a>
            )}

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
            <h1>
              {businessName || "Your Business"}

              {heroSubTitle && (
                <>
                  <br />

                  <span>{heroSubTitle}</span>
                </>
              )}
            </h1>

            {heroTitle && <p className="hero-description">{heroTitle}</p>}

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
            <div className="gallery-grid">
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

                const galleryImage = {
                  ...image,
                  url: imageUrl,
                  name: imageName,
                };

                return (
                  <button
                    type="button"
                    className="gallery-item"
                    key={image.id || `gallery-${index}`}
                    onClick={() => openGalleryImage(galleryImage)}
                    aria-label={`Open ${imageName}`}
                  >
                    <img src={imageUrl} alt={imageName} loading="lazy" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-gallery">
              <p>No gallery photos added yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
          GALLERY LIGHTBOX
          ================================================== */}

      {selectedGalleryImage && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image preview"
          onClick={closeGalleryImage}
        >
          <button
            type="button"
            className="gallery-lightbox-close"
            onClick={(event) => {
              event.stopPropagation();
              closeGalleryImage();
            }}
            aria-label="Close image"
          >
            ×
          </button>

          <div
            className="gallery-lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedGalleryImage.url}
              alt={selectedGalleryImage.name}
            />
          </div>
        </div>
      )}

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
                className="about-logo"
              />
            ) : (
              <div className="about-icon">🏢</div>
            )}
          </div>

          <div className="about-content">
            <span className="section-label">ABOUT US</span>

            <h2>Get to know {businessName}.</h2>

            <p>
              {about ||
                `${businessName} is committed to providing dependable service and a positive experience for every customer.`}
            </p>

            <button
              type="button"
              className="about-action"
              onClick={() => scrollToSection("contact")}
            >
              Contact {businessName}
            </button>
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

            {heroSubTitle && <p>{heroSubTitle}</p>}
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
