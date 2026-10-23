# Hotel Desk — Hotel Management System

A React + Vite starter application for a restaurant / darshini. Includes:
- POS billing with quantity controls, discount, payment method and 80mm thermal receipt printing
- Saved sales register, reprint and cancellation marking
- Purchase register with supplier, paid/balance amounts and automatic stock increase
- Expense register
- Stock items and low-stock thresholds
- Supplier directory with purchase and outstanding balance summaries
- Menu management
- Daily/month-to-date reports and CSV exports
- Hotel receipt settings and JSON backup/restore
- Responsive layouts for desktop and mobile

## Run locally

1. Install Node.js (LTS) from https://nodejs.org/
2. Extract this ZIP and open a terminal in the `hotel-management-system` folder.
3. Run `npm install`
4. Run `npm run dev`
5. Open the local URL printed by Vite.

## Important data limitation

This starter currently saves data in the browser's `localStorage`. It persists across reloads in the same browser on the same device, but it is **not cloud sync** and does not share records between a computer and mobile. Clearing browser data can erase records. Use the built-in JSON backup regularly.

Before using this for official daily accounts across multiple devices, connect a real cloud database with authentication, access rules, automated backups and appropriate accounting/tax review. Stock usage is not automatically deducted from sales yet; use stock counts and purchase updates as a starting point. The profit figure is a simple sales-minus-purchases-minus-expenses estimate, not formal accounting profit.

## Thermal printing

The app opens a receipt in a separate window and invokes the browser print dialog. Choose your installed 80mm thermal printer and set paper width / margins in its print preferences. Browser and printer driver settings vary by device.
