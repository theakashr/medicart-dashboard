# MediCart - Advanced Medical Shop Management System

MediCart is a comprehensive, full-stack pharmacy management system designed to streamline the operations of a medical shop. It handles everything from inventory tracking and billing to customer and staff management.

## Features

- **Authentication**: Secure login and signup for staff and administrators.
- **Billing & Invoicing**: Create bills, apply GST, manage cart items, and generate invoices.
- **Inventory Management**: Track medicines, stock levels, batches, and expiry dates.
- **Customer Management**: Maintain customer details and purchase history.
- **Staff Management**: Add, update, and manage staff roles and permissions.
- **Reporting**: Generate sales reports and view overall business analytics.
- **Responsive UI**: A user-friendly front-end designed with HTML, CSS, and vanilla JavaScript.

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Deployment**: Configured for Vercel Serverless Functions

## Project Structure

```
├── api/                  # Vercel serverless entry point (index.js)
├── middleware/           # Express middlewares (auth, upload, etc.)
├── models/               # Mongoose schema definitions
├── public/               # Frontend assets (HTML, CSS, JS, Images)
├── routes/               # Express API routes
├── .env                  # Environment variables (create this)
├── package.json          # Node dependencies and scripts
├── server.js             # Local development server entry point
├── seed.js               # Script to seed sample data into the database
└── vercel.json           # Vercel deployment configuration
```

## Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/medicart.git
   cd medicart
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add the following variables:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   SHOP_NAME="MediCart Pharmacy"
   SHOP_ADDRESS="123 Health Street, City"
   SHOP_PHONE="1234567890"
   SHOP_GSTIN="22AAAAA0000A1Z5"
   ```

4. **Seed Sample Data (Optional):**
   To populate the database with sample medicines and an admin account:
   ```bash
   npm run seed
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Deployment (Vercel)

This project is pre-configured for seamless deployment on [Vercel](https://vercel.com).

1. Push your code to a GitHub repository.
2. Go to Vercel and import your repository.
3. In the Vercel project settings, configure the following Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SHOP_NAME`
   - `SHOP_ADDRESS`
   - `SHOP_PHONE`
   - `SHOP_GSTIN`
4. Deploy the project. The custom `vercel.json` ensures that both the API routes and the static `public/` files are served correctly.

## Default Admin Credentials

If you seeded the database, you can log in using:
- **Email:** `admin@medicart.com`
- **Password:** `admin123`

## License

This project is licensed under the MIT License.
