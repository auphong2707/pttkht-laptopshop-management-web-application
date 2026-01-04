# 💻 Laptop Shop Management Web Application

A full-stack e-commerce web application for laptop retail management, featuring comprehensive customer and admin functionalities, built with modern web technologies.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Customer Features
- **Product Browsing**: Browse laptop catalog with advanced search powered by Elasticsearch
- **Shopping Cart**: Add, update, and manage items in cart
- **Order Management**: Place orders and track order status
- **Product Reviews**: Write and view product reviews
- **Payment Processing**: Secure payment gateway integration with QR code support
- **User Profile**: Manage account information and view order history
- **Refund Requests**: Submit and track refund tickets

### Admin Features
- **Dashboard Analytics**: View sales metrics, revenue statistics, and business insights
- **Inventory Management**: Add, edit, and manage product catalog
- **Order Dashboard**: Monitor and process customer orders
- **Refund Panel**: Handle customer refund requests
- **Product Management**: Complete CRUD operations for laptop products

### System Features
- **JWT Authentication**: Secure user authentication and authorization
- **Role-based Access Control**: Separate customer and admin functionalities
- **Real-time Search**: Elasticsearch integration for fast product searches
- **Database Synchronization**: Logstash pipeline for PostgreSQL to Elasticsearch sync
- **Containerized Deployment**: Docker-based microservices architecture
- **Responsive Design**: Modern UI with Ant Design components

## 🛠 Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and development server
- **Ant Design 5** - UI component library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Styled Components** - CSS-in-JS styling
- **QR Code libraries** - Payment QR code generation

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **PostgreSQL** - Primary database
- **Elasticsearch** - Search engine
- **Logstash** - Data pipeline
- **JWT/OAuth** - Authentication
- **BCrypt** - Password hashing
- **Psycopg2** - PostgreSQL adapter

### DevOps
- **Docker & Docker Compose** - Containerization
- **PostgreSQL** (with pg_cron extension)
- **Elasticsearch 8.17.3**
- **Python 3.x**
- **Node.js** (for frontend)

## 🏗 Architecture

The application follows a microservices architecture with the following components:

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Frontend  │─────▶│   Backend   │─────▶│  PostgreSQL  │
│  (React)    │      │  (FastAPI)  │      │   Database   │
└─────────────┘      └─────────────┘      └──────────────┘
                            │                      │
                            │                      ▼
                            │              ┌──────────────┐
                            │              │   Logstash   │
                            │              └──────────────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐      ┌──────────────┐
                     │Elasticsearch │◀─────│              │
                     └──────────────┘      └──────────────┘
```

- **Frontend**: Serves the React application on port 5173
- **Backend**: FastAPI server on port 8000
- **Database**: PostgreSQL on port 5432
- **Elasticsearch**: Search engine on ports 9200/9300
- **Logstash**: Data synchronization service on port 5044

## 📦 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pttkht-laptopshop-management-web-application
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=laptopshop

# Database Connection (for Backend)
PGHOST=db
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_secure_password
PGDATABASE=laptopshop

# Elasticsearch Configuration
ES_DISCOVERY_TYPE=single-node
ES_SECURITY_ENABLED=false
ES_DESTRUCTIVE_REQUIRES_NAME=true
ES_JAVA_OPTS=-Xms512m -Xmx512m
ELASTICSEARCH_HOST=elasticsearch
ELASTICSEARCH_PORT=9200

# JWT Authentication
SECRET_KEY=your_secret_key_here
ADMIN_CREATION_SECRET=your_admin_secret_here

# Frontend Configuration
VITE_API_URL=http://localhost:8000
```

### 3. Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### 4. Initialize Database (Optional)

Generate sample data for testing:

```bash
# Access backend container
docker exec -it laptopshop-backend bash

# Run sample data generation
python commands/generate_sample_data.py

# Ensure admin account exists
python commands/ensure_admin.py
```

## 📖 Usage

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Elasticsearch**: http://localhost:9200

### Default Admin Account

After running `ensure_admin.py`, use the credentials from your environment configuration to log in as admin.

### Development Mode

#### Run Backend Locally

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
.
├── backend/                    # FastAPI backend application
│   ├── commands/               # Database scripts and utilities
│   ├── controllers/            # Business logic controllers
│   ├── db/                     # Database configuration and models
│   │   └── models/             # SQLAlchemy models
│   ├── routes/                 # API route definitions
│   ├── schemas/                # Pydantic schemas for validation
│   ├── services/               # Service layer (auth, etc.)
│   ├── static/                 # Static files (images, templates)
│   ├── data/                   # Sample data from various sources
│   ├── main.py                 # Application entry point
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React frontend application
│   ├── public/                 # Public assets
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── layouts/            # Layout components
│   │   ├── pages/              # Page components
│   │   │   ├── admin/          # Admin pages
│   │   │   ├── customer/       # Customer pages
│   │   │   ├── auth/           # Authentication pages
│   │   │   └── public/         # Public pages
│   │   └── utils/              # Utility functions
│   ├── package.json            # Node dependencies
│   └── vite.config.js          # Vite configuration
│
├── documentation/              # Project documentation
│   ├── Drawio/                 # System diagrams
│   └── Images/                 # Documentation images
│
├── docker-compose.yml          # Docker orchestration
├── Dockerfile.backend          # Backend container configuration
├── Dockerfile.frontend         # Frontend container configuration
├── Dockerfile.postgres         # PostgreSQL container configuration
├── Dockerfile.logstash         # Logstash container configuration
└── README.md                   # This file
```

## 🔌 API Documentation

### Main API Endpoints

#### Authentication
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user info

#### Products/Laptops
- `GET /laptops` - List all laptops
- `GET /laptops/{id}` - Get laptop details
- `POST /laptops` - Create new laptop (admin)
- `PUT /laptops/{id}` - Update laptop (admin)
- `DELETE /laptops/{id}` - Delete laptop (admin)

#### Cart
- `GET /cart` - Get user's cart
- `POST /cart/items` - Add item to cart
- `PUT /cart/items/{id}` - Update cart item
- `DELETE /cart/items/{id}` - Remove from cart

#### Orders
- `GET /orders` - List user's orders
- `POST /orders` - Create new order
- `GET /orders/{id}` - Get order details
- `PUT /orders/{id}/status` - Update order status (admin)

#### Reviews
- `GET /reviews` - List reviews
- `POST /reviews` - Create review
- `PUT /reviews/{id}` - Update review
- `DELETE /reviews/{id}` - Delete review

#### Payments
- `POST /payments/process` - Process payment
- `GET /payments/{id}` - Get payment details

#### Refunds
- `GET /refund_tickets` - List refund tickets
- `POST /refund_tickets` - Create refund ticket
- `PUT /refund_tickets/{id}` - Update refund status (admin)

#### Analytics (Admin)
- `GET /analytics/sales` - Sales statistics
- `GET /analytics/revenue` - Revenue metrics
- `GET /analytics/products` - Product performance

For detailed API documentation, visit http://localhost:8000/docs after starting the application.

## 🧪 Testing

```bash
# Run backend tests
cd backend
pytest

# Run frontend linting
cd frontend
npm run lint
```

## 🔧 Maintenance

### Database Operations

```bash
# Reset database
cd backend
bash reset_database.sh

# Run migrations
python commands/create_table.sql

# Generate sample images
python commands/generate_images.py
```

### Code Quality

```bash
# Format backend code
cd backend
black .
isort .

# Lint frontend code
cd frontend
npm run lint
bash ../lint-fix.sh
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

Project developed as part of PTTKHT (Phân Tích Thiết Kế Hệ Thống) coursework.

## 🙏 Acknowledgments

- Sample data sourced from Vietnamese laptop retailers (GearVN, HACOM, LaptopAZ, PhongVu, TGDD)
- Built with modern open-source technologies and frameworks

---

**Note**: This application is for educational purposes. Ensure proper security configurations before deploying to production.
