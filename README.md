# RecordBook - Business Management App

A modern Progressive Web App (PWA) for managing business finances, customers, invoices, and GST reports.

## Features

### 📊 Dashboard
- View total receivables and payables at a glance
- Net balance calculation
- Customer list with search functionality
- Sort customers by balance or name

### 👥 Customer Management
- Add/edit/delete customers
- Track customer balances
- Search and filter customers
- WhatsApp integration for sharing balances

### 🧾 Invoice & Billing
- Professional invoice generation with sequential numbering (INV25010001)
- GST calculation per item (CGST/SGST split)
- Round-off options (Round Up/Round Down)
- Payment method tracking (Cash, GPay, Card)
- Share invoices as images
- Edit paid amounts

### 📈 GST Reports
- Date range filtering
- GST summary (Taxable Value, CGST, SGST, Total GST)
- Rate-wise breakdown table
- Detailed bill listing
- Export to CSV

### 💰 Transaction History
- Track "You Gave" and "You Got" transactions
- Search by customer, amount, or notes
- Sort by date or amount
- Payment method tracking

### ⚙️ Settings
- Business profile (Name, Phone, Address, GST Number)
- Dark/Light theme toggle
- Backup & Restore (compressed .dlb files)
- Install as PWA (works offline)

### 📱 Progressive Web App
- Install on mobile and desktop
- Offline support
- Native app-like experience
- Data persists in localStorage

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite
- **Storage**: localStorage (persistent)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Image Export**: html2canvas
- **Compression**: lz-string

## Installation

```bash
# Clone repository
git clone https://github.com/Pravin-0707/RecordBook.git

# Navigate to project
cd RecordBook

# Install dependencies
npm install

# Start development server
npm run dev
```

## Build for Production

```bash
npm run build
```

## Features in Detail

### Invoice Numbering
Format: `INV + YY + MM + ####`
- Example: INV25010001 (First invoice of January 2025)
- Sequential numbering per user

### GST Calculation
- Per-item GST rates
- Automatic CGST/SGST split (50/50)
- Rate-wise breakdown in reports

### Data Persistence
- All data stored in browser localStorage
- Survives app restarts, device reboots
- Export/Import backup functionality
- No server required

### Responsive Design
- Mobile-first approach
- Hamburger menu on mobile
- Sidebar navigation on desktop
- Works on screens 320px and above

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## License

MIT License

## Author

Pravin

---

**RecordBook** - Simple, Fast, Offline-Ready Business Management
