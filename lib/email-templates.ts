// Luxurious email templates for BeautyFlow
// Brand colors: Gold (#d4a843), Dark Anthracite (#1c1c1a), Light (#f5f5f4)

const BRAND_GOLD = "#d4a843"
const BRAND_DARK = "#1c1c1a"
const BRAND_CARD = "#262624"
const BRAND_MUTED = "#a8a8a6"
const BRAND_LIGHT = "#f5f5f4"

const baseStyles = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${BRAND_DARK};
      color: ${BRAND_LIGHT};
      margin: 0;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: ${BRAND_CARD};
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    
    .header {
      background: linear-gradient(135deg, ${BRAND_GOLD} 0%, #c49a3a 50%, ${BRAND_GOLD} 100%);
      padding: 40px 32px;
      text-align: center;
      position: relative;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.3;
    }
    
    .logo {
      position: relative;
      z-index: 1;
    }
    
    .logo-icon {
      width: 56px;
      height: 56px;
      background: ${BRAND_DARK};
      border-radius: 12px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }
    
    .logo-text {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 600;
      color: ${BRAND_DARK};
      letter-spacing: 1px;
    }
    
    .header-title {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 500;
      color: ${BRAND_DARK};
      margin-top: 16px;
      position: relative;
      z-index: 1;
    }
    
    .content {
      padding: 32px;
    }
    
    .greeting {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
      color: ${BRAND_LIGHT};
    }
    
    .details-card {
      background: ${BRAND_DARK};
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid rgba(212, 168, 67, 0.15);
    }
    
    .detail-row:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${BRAND_MUTED};
      font-weight: 500;
    }
    
    .detail-value {
      font-size: 15px;
      font-weight: 500;
      color: ${BRAND_LIGHT};
      text-align: right;
    }
    
    .detail-value.highlight {
      color: ${BRAND_GOLD};
      font-weight: 600;
    }
    
    .buttons {
      display: flex;
      gap: 16px;
      margin: 32px 0;
    }
    
    .btn {
      display: inline-block;
      flex: 1;
      padding: 16px 24px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn-accept {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
    }
    
    .btn-reject {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
    }
    
    .btn-primary {
      background: linear-gradient(135deg, ${BRAND_GOLD} 0%, #c49a3a 100%);
      color: ${BRAND_DARK};
      box-shadow: 0 4px 14px rgba(212, 168, 67, 0.35);
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(212, 168, 67, 0.3) 50%, transparent 100%);
      margin: 24px 0;
    }
    
    .note {
      background: rgba(212, 168, 67, 0.08);
      border-left: 3px solid ${BRAND_GOLD};
      padding: 16px;
      border-radius: 0 8px 8px 0;
      font-size: 14px;
      color: ${BRAND_MUTED};
      line-height: 1.6;
    }
    
    .map-placeholder {
      background: ${BRAND_DARK};
      border-radius: 12px;
      height: 180px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 24px 0;
      border: 1px dashed rgba(212, 168, 67, 0.3);
    }
    
    .map-icon {
      font-size: 36px;
      margin-bottom: 8px;
    }
    
    .map-text {
      font-size: 13px;
      color: ${BRAND_MUTED};
    }
    
    .footer {
      background: ${BRAND_DARK};
      padding: 24px 32px;
      text-align: center;
    }
    
    .footer-text {
      font-size: 12px;
      color: ${BRAND_MUTED};
      line-height: 1.6;
    }
    
    .footer-brand {
      color: ${BRAND_GOLD};
      font-weight: 500;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-pending {
      background: rgba(234, 179, 8, 0.15);
      color: #eab308;
    }
    
    .status-confirmed {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }
    
    .status-rejected {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
  </style>
`

interface BookingData {
  clientName: string
  clientEmail: string
  clientPhone?: string
  procedureName: string
  slotDisplay: string
  token: string
}

// Email template for owner - new booking notification
export function ownerNewBookingEmail(booking: BookingData, appUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Nowa Rezerwacja - BeautyFlow</title>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">✨</div>
            <div class="logo-text">BeautyFlow</div>
          </div>
          <div class="header-title">Nowa Rezerwacja</div>
        </div>
        
        <div class="content">
          <p class="greeting">
            Otrzymałaś nowe zgłoszenie rezerwacji. Poniżej znajdziesz szczegóły oraz możliwość akceptacji lub odrzucenia.
          </p>
          
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Klientka</span>
              <span class="detail-value highlight">${booking.clientName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${booking.clientEmail}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Telefon</span>
              <span class="detail-value">${booking.clientPhone || "Nie podano"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Zabieg</span>
              <span class="detail-value highlight">${booking.procedureName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Termin</span>
              <span class="detail-value highlight">${booking.slotDisplay}</span>
            </div>
          </div>
          
          <div class="buttons">
            <a href="${appUrl}/api/bookings/${booking.token}/accept" class="btn btn-accept">
              ✓ Akceptuj
            </a>
            <a href="${appUrl}/api/bookings/${booking.token}/reject" class="btn btn-reject">
              ✕ Odrzuć
            </a>
          </div>
          
          <div class="note">
            <strong>Wskazówka:</strong> Kliknięcie przycisku automatycznie wyśle powiadomienie do klientki z informacją o Twojej decyzji.
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            Ta wiadomość została wygenerowana automatycznie przez system <span class="footer-brand">BeautyFlow</span>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Email template for client - booking pending confirmation
export function clientPendingEmail(booking: BookingData): string {
  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Rezerwacja Oczekuje - BeautyFlow</title>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">✨</div>
            <div class="logo-text">BeautyFlow</div>
          </div>
          <div class="header-title">Dziękujemy za Rezerwację</div>
        </div>
        
        <div class="content">
          <p class="greeting">
            Droga <strong>${booking.clientName}</strong>,<br><br>
            Dziękujemy za dokonanie rezerwacji! Twoje zgłoszenie zostało przyjęte i oczekuje na potwierdzenie. Wkrótce otrzymasz wiadomość z decyzją.
          </p>
          
          <div style="text-align: center; margin: 24px 0;">
            <span class="status-badge status-pending">⏳ Oczekuje na potwierdzenie</span>
          </div>
          
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Zabieg</span>
              <span class="detail-value highlight">${booking.procedureName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Planowany termin</span>
              <span class="detail-value highlight">${booking.slotDisplay}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="map-placeholder">
            <div class="map-icon">📍</div>
            <div class="map-text">Lokalizacja salonu zostanie wysłana<br>po potwierdzeniu rezerwacji</div>
          </div>
          
          <div class="note">
            <strong>Co dalej?</strong> Otrzymasz email z potwierdzeniem lub propozycją innego terminu w ciągu 24 godzin. W razie pytań, skontaktuj się z nami telefonicznie.
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            Z eleganckim pozdrowieniem,<br>
            <span class="footer-brand">Zespół BeautyFlow</span>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Email template for client - booking confirmed
export function clientConfirmedEmail(booking: BookingData): string {
  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Rezerwacja Potwierdzona - BeautyFlow</title>
      ${baseStyles}
      <style>
        .header {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #22c55e 100%);
        }
        .header-title, .logo-text {
          color: white;
        }
        .logo-icon {
          background: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">✓</div>
            <div class="logo-text">BeautyFlow</div>
          </div>
          <div class="header-title">Rezerwacja Potwierdzona!</div>
        </div>
        
        <div class="content">
          <p class="greeting">
            Droga <strong>${booking.clientName}</strong>,<br><br>
            Wspaniała wiadomość! Twoja rezerwacja została potwierdzona. Nie możemy się doczekać Twojej wizyty!
          </p>
          
          <div style="text-align: center; margin: 24px 0;">
            <span class="status-badge status-confirmed">✓ Potwierdzona</span>
          </div>
          
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Zabieg</span>
              <span class="detail-value highlight">${booking.procedureName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Data i godzina</span>
              <span class="detail-value highlight">${booking.slotDisplay}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="map-placeholder">
            <div class="map-icon">📍</div>
            <div class="map-text">ul. Przykładowa 123, Warszawa<br>
            <a href="https://maps.google.com" style="color: ${BRAND_GOLD}; text-decoration: none;">Otwórz w Mapach Google →</a></div>
          </div>
          
          <div class="note">
            <strong>Pamiętaj:</strong> Przyjdź 5-10 minut przed umówionym czasem. W razie konieczności zmiany terminu, prosimy o kontakt co najmniej 24 godziny wcześniej.
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            Do zobaczenia!<br>
            <span class="footer-brand">Zespół BeautyFlow</span>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Email template for client - booking rejected
export function clientRejectedEmail(booking: BookingData, appUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Zmiana Terminu - BeautyFlow</title>
      ${baseStyles}
      <style>
        .header {
          background: linear-gradient(135deg, ${BRAND_GOLD} 0%, #c49a3a 100%);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">📅</div>
            <div class="logo-text">BeautyFlow</div>
          </div>
          <div class="header-title">Proponujemy Inny Termin</div>
        </div>
        
        <div class="content">
          <p class="greeting">
            Droga <strong>${booking.clientName}</strong>,<br><br>
            Niestety, wybrany przez Ciebie termin nie jest już dostępny. Bardzo przepraszamy za niedogodności i serdecznie zapraszamy do wyboru innego terminu.
          </p>
          
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Wybrany zabieg</span>
              <span class="detail-value">${booking.procedureName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Niedostępny termin</span>
              <span class="detail-value" style="text-decoration: line-through; color: ${BRAND_MUTED};">${booking.slotDisplay}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${appUrl}" class="btn btn-primary" style="display: inline-block; min-width: 200px;">
              Wybierz nowy termin →
            </a>
          </div>
          
          <div class="note">
            <strong>Potrzebujesz pomocy?</strong> Skontaktuj się z nami telefonicznie, a pomożemy znaleźć idealny termin dla Ciebie.
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            Z pozdrowieniami,<br>
            <span class="footer-brand">Zespół BeautyFlow</span>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
