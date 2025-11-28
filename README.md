# ShoeStore Management System

This repository contains the full implementation of the **Final Term Project** for the Database Systems course at **Yachay Tech University**. The project includes a complete relational database, a fully functional RESTful API using Flask-SQLAlchemy, and an HTML-based GUI for managing a shoe store inventory, customers, orders, and shipments.

---

## 📌 Project Status — Fully Completed (100%)

The repository now contains all required components for the final project:

### ✔ Database Schema (Complete)

The file `ShoeStore.sql` contains the full SQL script that defines the relational database:

- **Supplier**
- **Product**
- **Customer**
- **Orders**
- **OrderDetail**
- **Shipment**

The script also includes:
- Primary and foreign keys
- Referential integrity
- Sample data for all tables

### ✔ Full RESTful API (Complete)

The file `Flask-MySQL/app_shoestore.py` implements a complete Flask API, featuring:

**Implemented CRUD operations:**
- **Suppliers** — GET, POST, PUT, DELETE
- **Products** — GET, POST, PUT, DELETE
- **Customers** — GET, POST, PUT, DELETE
- **Orders** — GET, POST, PUT, DELETE
- **OrderDetail** — GET, POST, DELETE
- **Shipments** — GET, POST, PUT, DELETE

The API uses:
- Flask
- Flask-SQLAlchemy
- Marshmallow
- PyMySQL

All models, schemas, relationships and validations are fully implemented.

### ✔ HTML GUI Frontend (Complete)

A functional HTML/CSS/JS-based graphical user interface is included, providing:

- Product management
- Supplier management
- Customer forms
- Order creation and visualization
- Shipment status updates
- API integration for dynamic content

This GUI serves as the user-facing dashboard for the ShoeStore system.

---

## 📁 Repository Structure

```
DB_Final_Project/
├── Flask-MySQL/
│   └── app_shoestore.py        # Full Flask REST API (all CRUD complete)
├── GUI/                        # HTML/CSS/JS graphical interface
│   └── ... (frontend files)
└── ShoeStore.sql               # Complete MySQL schema + sample data
```

---

## 🚀 Development Timeline

### 🔹 Project Advance 1 (20%)
- Conceptual and logical model
- Initial database schema
- Partial API (Suppliers & Products CRUD)

### 🔹 Project Advance 2 (30%)
- CRUD for Customers, Orders, OrderDetail, Shipments
- GUI integration (50%)
- Extended API endpoints

### 🔹 Final Term Project (50%)
- Fully functional REST API
- Fully implemented HTML GUI
- Complete database
- Final documentation & testing

---

## 🛠️ Technologies Used

- **Python 3**
- **Flask**
- **Flask-SQLAlchemy**
- **Flask-Marshmallow**
- **MySQL 8.0**
- **HTML / CSS / JavaScript**
- **Docker** (optional for MySQL deployment)

---

## ▶️ How to Run the Project

### 1. Import the database

```bash
mysql -u root -p < ShoeStore.sql
```

### 2. Install dependencies

```bash
pip install flask flask_sqlalchemy flask_marshmallow marshmallow pymysql
```

### 3. Start the Flask API

```bash
python3 Flask-MySQL/app_shoestore.py
```

API runs at:
```
http://127.0.0.1:5000/
```

### 4. Open the GUI

Open any `.html` file in the `GUI/` folder in your browser.

---

## 👥 Authors

**Kevin Erazo — Steven Rodríguez**

Database Systems — Yachay Tech University  
November 2025

---

## 📄 License

This project is part of an academic assignment at Yachay Tech University.
