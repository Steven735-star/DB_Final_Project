CREATE DATABASE ShoeStore;
USE ShoeStore;

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