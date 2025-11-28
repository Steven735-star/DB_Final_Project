-- ======================================================
-- DATABASE CREATION
-- ======================================================
DROP DATABASE IF EXISTS ShoeStore;
CREATE DATABASE ShoeStore;
USE ShoeStore;

-- ======================================================
-- TABLE DEFINITIONS
-- ======================================================

CREATE TABLE Supplier (
  supplier_id INTEGER NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  country VARCHAR(50) NOT NULL,
  PRIMARY KEY (supplier_id)
);

CREATE TABLE Product (
  product_id INTEGER NOT NULL AUTO_INCREMENT,
  supplier_id INTEGER NOT NULL,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id),
  FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id)
);

CREATE TABLE Customer (
  customer_id INTEGER NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  address VARCHAR(200) NOT NULL,
  PRIMARY KEY (customer_id)
);

CREATE TABLE Orders (
  order_id INTEGER NOT NULL AUTO_INCREMENT,
  customer_id INTEGER NOT NULL,
  order_date DATE NOT NULL,
  PRIMARY KEY (order_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE OrderDetail (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES Orders(order_id),
  FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

CREATE TABLE Shipment (
  shipment_id INTEGER NOT NULL AUTO_INCREMENT,
  order_id INTEGER NOT NULL,
  courier VARCHAR(100) NOT NULL DEFAULT 'Servientrega',
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (shipment_id),
  FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);

-- ======================================================
-- INSERT DATA: SUPPLIERS
-- ======================================================
INSERT INTO Supplier (name, country) VALUES
('Nike', 'USA'),
('Adidas', 'Germany'),
('Puma', 'Germany'),
('Reebok', 'UK'),
('Converse', 'USA'),
('New Balance', 'USA'),
('Asics', 'Japan'),
('Fila', 'South Korea');

-- ======================================================
-- INSERT DATA: PRODUCTS
-- ======================================================
INSERT INTO Product (supplier_id, brand, model, size, price, stock) VALUES
(1, 'Nike', 'Air Max 90', 42, 120.00, 25),
(1, 'Nike', 'Jordan Retro 4', 44, 180.00, 12),
(1, 'Nike', 'Cortez Classic', 41, 90.00, 30),
(2, 'Adidas', 'Ultraboost 22', 43, 190.00, 20),
(2, 'Adidas', 'Superstar', 42, 100.00, 15),
(2, 'Adidas', 'Gazelle', 40, 85.00, 28),
(3, 'Puma', 'RS-X', 41, 110.00, 35),
(3, 'Puma', 'Suede Classic', 42, 95.00, 22),
(4, 'Reebok', 'Classic Leather', 43, 120.00, 18),
(4, 'Reebok', 'Nano X2', 44, 130.00, 14),
(5, 'Converse', 'Chuck Taylor High', 42, 70.00, 40),
(5, 'Converse', 'Run Star Hike', 39, 95.00, 18),
(6, 'New Balance', '574 Core', 43, 100.00, 27),
(6, 'New Balance', '990v6', 44, 200.00, 10),
(7, 'Asics', 'Gel Kayano 30', 42, 160.00, 16),
(7, 'Asics', 'GT-2000 12', 41, 140.00, 22),
(8, 'Fila', 'Disruptor II', 40, 85.00, 25),
(8, 'Fila', 'Grant Hill 2', 43, 110.00, 13);

-- ======================================================
-- INSERT DATA: CUSTOMERS
-- ======================================================
INSERT INTO Customer (name, email, address) VALUES
('Kevin Erazo', 'kevin.erazo@yachaytech.edu.ec', 'Ibarra, Ecuador'),
('Ana Torres', 'ana.torres@gmail.com', 'Quito, Ecuador'),
('Carlos Pérez', 'carlos.perez@hotmail.com', 'Guayaquil, Ecuador'),
('Lucía Andrade', 'lucia.andrade@gmail.com', 'Cuenca, Ecuador'),
('Diego Rojas', 'diego.rojas@outlook.com', 'Ambato, Ecuador'),
('María López', 'maria.lopez@yahoo.com', 'Loja, Ecuador'),
('Paola Quintana', 'paola.q@gmail.com', 'Quito, Ecuador'),
('Andrés Vargas', 'andres.vargas@gmail.com', 'Tulcán, Ecuador');

-- ======================================================
-- INSERT DATA: ORDERS
-- ======================================================
INSERT INTO Orders (customer_id, order_date) VALUES
(1, '2025-10-01'),
(2, '2025-10-02'),
(3, '2025-10-03'),
(4, '2025-10-05'),
(5, '2025-10-06'),
(6, '2025-10-08'),
(7, '2025-10-10'),
(8, '2025-10-12'),
(1, '2025-10-14'),
(3, '2025-10-18');

-- ======================================================
-- INSERT DATA: ORDER DETAILS
-- ======================================================
INSERT INTO OrderDetail (order_id, product_id, quantity) VALUES
(1, 1, 2),
(1, 2, 1),
(2, 4, 1),
(2, 5, 2),
(3, 7, 1),
(3, 8, 2),
(4, 10, 1),
(4, 11, 2),
(5, 3, 1),
(5, 12, 1),
(6, 14, 2),
(6, 15, 1),
(7, 16, 1),
(7, 13, 2),
(8, 17, 3),
(9, 18, 1),
(10, 9, 2),
(10, 6, 2);

-- ======================================================
-- INSERT DATA: SHIPMENTS
-- ======================================================
INSERT INTO Shipment (order_id, courier, status) VALUES
(1, 'Servientrega', 'Delivered'),
(2, 'DHL', 'Pending'),
(3, 'Servientrega', 'In Transit'),
(4, 'FedEx', 'Delivered'),
(5, 'Servientrega', 'Pending'),
(6, 'DHL', 'In Transit'),
(7, 'FedEx', 'Delivered'),
(8, 'Servientrega', 'Pending'),
(9, 'Servientrega', 'Delivered'),
(10, 'DHL', 'In Transit');
