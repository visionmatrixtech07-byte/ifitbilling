# FIT FORMULA Temporary Billing Engine

Open `index.html` in a browser, or upload this entire `outputs` folder to a GitHub repository and enable **Settings → Pages → Deploy from a branch**.

The app works on mobile and laptop. Invoices and store settings are held only in the browser used to create them. Use **Export backup** regularly; the exported JSON file is the recovery copy.

The PDF button uses the jsPDF library loaded from Cloudflare. The first PDF generation requires an internet connection. Saved invoices and all calculations work locally afterward.

Before use: expand **Set store / payment details** and enter the actual address, phone and UPI ID. The bill contains only products, discounts and the final payable amount.
