from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow.sqla import SQLAlchemyAutoSchema
from marshmallow import fields

# ======================================================
# Flask Configuration
# ======================================================
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:54321@127.0.0.1:3306/ShoeStore'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ======================================================
# Models (ORM)
# ======================================================

# ---- Supplier Table ----
class Supplier(db.Model):
    __tablename__ = 'Supplier'
    supplier_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    country = db.Column(db.String(50), nullable=False)

    # Relationship: 1 Supplier → N Products
    products = db.relationship('Product', backref='supplier', lazy=True)


# ---- Product Table ----
class Product(db.Model):
    __tablename__ = 'Product'
    product_id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('Supplier.supplier_id'), nullable=False)
    brand = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(100), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    stock = db.Column(db.Integer, nullable=False, default=0)

    # Relationship: N Products → M Orders via OrderDetail
    order_details = db.relationship('OrderDetail', backref='product', lazy=True)


# ---- Customer Table ----
class Customer(db.Model):
    __tablename__ = 'Customer'
    customer_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    address = db.Column(db.String(200), nullable=False)

    # Relationship: 1 Customer → N Orders
    orders = db.relationship('Orders', backref='customer', lazy=True)


# ---- Orders Table ----
class Orders(db.Model):
    __tablename__ = 'Orders'
    order_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('Customer.customer_id'), nullable=False)
    order_date = db.Column(db.Date, nullable=False)

    # Relationships
    details = db.relationship('OrderDetail', backref='order', lazy=True)
    shipment = db.relationship('Shipment', backref='order', lazy=True, uselist=False)


# ---- OrderDetail Table ----
class OrderDetail(db.Model):
    __tablename__ = 'OrderDetail'
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id'), primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('Product.product_id'), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)


# ---- Shipment Table ----
class Shipment(db.Model):
    __tablename__ = 'Shipment'
    shipment_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id'), nullable=False)
    courier = db.Column(db.String(100), nullable=False, default='Servientrega')
    status = db.Column(db.String(50), nullable=False, default='Pending')


# ======================================================
# Schemas (Marshmallow)
# ======================================================

class SupplierSchema(SQLAlchemyAutoSchema):
    class Meta(SQLAlchemyAutoSchema.Meta):
        model = Supplier
        sqla_session = db.session
    supplier_id = fields.Int(dump_only=True)
    name = fields.String(required=True)
    country = fields.String(required=True)
    products = fields.List(fields.Nested(lambda: ProductSchema()))


class ProductSchema(SQLAlchemyAutoSchema):
    class Meta(SQLAlchemyAutoSchema.Meta):
        model = Product
        sqla_session = db.session
        include_fk = True
    product_id = fields.Int(dump_only=True)
    supplier_id = fields.Int(required=True)
    brand = fields.String(required=True)
    model = fields.String(required=True)
    size = fields.Int(required=True)
    price = fields.Decimal(required=True)
    stock = fields.Int(required=True)


class CustomerSchema(SQLAlchemyAutoSchema):
    class Meta(SQLAlchemyAutoSchema.Meta):
        model = Customer
        sqla_session = db.session
    customer_id = fields.Int(dump_only=True)
    name = fields.String(required=True)
    email = fields.String(required=True)
    address = fields.String(required=True)
    orders = fields.List(fields.Nested(lambda: OrderSchema(exclude=('customer',))))


class OrderSchema(SQLAlchemyAutoSchema):
    class Meta(SQLAlchemyAutoSchema.Meta):
        model = Orders
        sqla_session = db.session
        include_fk = True
    order_id = fields.Int(dump_only=True)
    customer_id = fields.Int(required=True)
    order_date = fields.Date(required=True)


class ShipmentSchema(SQLAlchemyAutoSchema):
    class Meta(SQLAlchemyAutoSchema.Meta):
        model = Shipment
        sqla_session = db.session
        include_fk = True
    shipment_id = fields.Int(dump_only=True)
    order_id = fields.Int(required=True)
    courier = fields.String()
    status = fields.String()


# ======================================================
# Initialize Database
# ======================================================
with app.app_context():
    db.create_all()


# ======================================================
# Supplier Endpoints
# ======================================================

# GET all Suppliers
# curl -v http://127.0.0.1:5000/suppliers
@app.route('/suppliers', methods=['GET'])
def get_suppliers():
    suppliers = Supplier.query.all()
    schema = SupplierSchema(many=True)
    return jsonify(schema.dump(suppliers)), 200

# GET Supplier by ID
# curl -v http://127.0.0.1:5000/supplier/1
@app.route('/supplier/<int:id>', methods=['GET'])
def get_supplier(id):
    supplier = Supplier.query.get(id)
    if supplier:
        return jsonify(SupplierSchema().dump(supplier)), 200
    return jsonify({'message': 'Supplier not found'}), 404

# CREATE Supplier
# curl -X POST http://127.0.0.1:5000/supplier -H "Content-Type: application/json" -d "{\"name\":\"Nike\",\"country\":\"USA\"}"
@app.route('/supplier', methods=['POST'])
def create_supplier():
    data = request.get_json()
    try:
        new_data = SupplierSchema().load(data)
        supplier = Supplier(**new_data)
        db.session.add(supplier)
        db.session.commit()
        return jsonify(SupplierSchema().dump(supplier)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# UPDATE Supplier
# curl -X PUT http://127.0.0.1:5000/supplier/1 -H "Content-Type: application/json" -d "{\"country\":\"Germany\"}"
@app.route('/supplier/<int:id>', methods=['PUT'])
def update_supplier(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({'message': 'Supplier not found'}), 404
    data = request.get_json()
    supplier.name = data.get('name', supplier.name)
    supplier.country = data.get('country', supplier.country)
    db.session.commit()
    return jsonify({'message': 'Supplier updated successfully'}), 200

# DELETE Supplier
# curl -X DELETE http://127.0.0.1:5000/supplier/1
@app.route('/supplier/<int:id>', methods=['DELETE'])
def delete_supplier(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({'message': 'Supplier not found'}), 404
    db.session.delete(supplier)
    db.session.commit()
    return jsonify({'message': 'Supplier deleted successfully'}), 200


# ======================================================
# Product Endpoints
# ======================================================

# CREATE product
# curl -X POST http://127.0.0.1:5000/product -H "Content-Type: application/json" -d "{\"supplier_id\":1,\"brand\":\"Nike\",\"model\":\"Air Max 90\",\"size\":42,\"price\":120.00,\"stock\":10}"
@app.route('/product', methods=['POST'])
def create_product():
    data = request.get_json()
    new_product = Product(
        supplier_id=data['supplier_id'],
        brand=data['brand'],
        model=data['model'],
        size=data['size'],
        price=data['price'],
        stock=data['stock']
    )
    db.session.add(new_product)
    db.session.commit()
    return jsonify({"message": "Product created successfully"}), 201


# GET all products
# curl -v http://127.0.0.1:5000/products
@app.route('/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    schema = ProductSchema(many=True)
    return jsonify(schema.dump(products)), 200


# GET product by ID
# curl -v http://127.0.0.1:5000/product/1
@app.route('/product/<int:id>', methods=['GET'])
def get_product(id):
    product = Product.query.get(id)
    if product:
        schema = ProductSchema()
        return jsonify(schema.dump(product)), 200
    else:
        return jsonify({"message": "Product not found"}), 404


# UPDATE product
# curl -X PUT http://127.0.0.1:5000/product/1 -H "Content-Type: application/json" -d "{\"price\":140.00,\"stock\":20}"
@app.route('/product/<int:id>', methods=['PUT'])
def update_product(id):
    product = Product.query.get(id)
    if product:
        data = request.get_json()
        product.brand = data.get('brand', product.brand)
        product.model = data.get('model', product.model)
        product.size = data.get('size', product.size)
        product.price = data.get('price', product.price)
        product.stock = data.get('stock', product.stock)
        db.session.commit()
        return jsonify({"message": "Product updated successfully"}), 200
    else:
        return jsonify({"message": "Product not found"}), 404


# DELETE product
# curl -X DELETE http://127.0.0.1:5000/product/1
@app.route('/product/<int:id>', methods=['DELETE'])
def delete_product(id):
    product = Product.query.get(id)
    if product:
        db.session.delete(product)
        db.session.commit()
        return jsonify({"message": "Product deleted successfully"}), 200
    else:
        return jsonify({"message": "Product not found"}), 404

# ======================================================
# Customer Endpoints
# ======================================================

# CREATE customer
# curl -X POST http://127.0.0.1:5000/customer -H "Content-Type: application/json" -d "{\"name\":\"Kevin Erazo\",\"email\":\"kevin@example.com\",\"address\":\"Ibarra, Ecuador\"}"
@app.route('/customer', methods=['POST'])
def create_customer():
    data = request.get_json()
    new_customer = Customer(
        name=data['name'],
        email=data['email'],
        address=data['address']
    )
    db.session.add(new_customer)
    db.session.commit()
    return jsonify({"message": "Customer created successfully"}), 201


# GET all customers
# curl -v http://127.0.0.1:5000/customers
@app.route('/customers', methods=['GET'])
def get_customers():
    customers = Customer.query.all()
    schema = CustomerSchema(many=True)
    return jsonify(schema.dump(customers)), 200


# GET customer by ID
# curl -v http://127.0.0.1:5000/customer/1
@app.route('/customer/<int:id>', methods=['GET'])
def get_customer(id):
    customer = Customer.query.get(id)
    if customer:
        schema = CustomerSchema()
        return jsonify(schema.dump(customer)), 200
    else:
        return jsonify({"message": "Customer not found"}), 404


# UPDATE customer
# curl -X PUT http://127.0.0.1:5000/customer/1 -H "Content-Type: application/json" -d "{\"address\":\"Quito, Ecuador\"}"
@app.route('/customer/<int:id>', methods=['PUT'])
def update_customer(id):
    customer = Customer.query.get(id)
    if customer:
        data = request.get_json()
        customer.name = data.get('name', customer.name)
        customer.email = data.get('email', customer.email)
        customer.address = data.get('address', customer.address)
        db.session.commit()
        return jsonify({"message": "Customer updated successfully"}), 200
    else:
        return jsonify({"message": "Customer not found"}), 404


# DELETE customer
# curl -X DELETE http://127.0.0.1:5000/customer/1
@app.route('/customer/<int:id>', methods=['DELETE'])
def delete_customer(id):
    customer = Customer.query.get(id)
    if customer:
        db.session.delete(customer)
        db.session.commit()
        return jsonify({"message": "Customer deleted successfully"}), 200
    else:
        return jsonify({"message": "Customer not found"}), 404

# ======================================================
# Orders Endpoints
# ======================================================

# CREATE order
# curl -X POST http://127.0.0.1:5000/order -H "Content-Type: application/json" -d "{\"customer_id\":1,\"order_date\":\"2025-10-30\"}"
@app.route('/order', methods=['POST'])
def create_order():
    data = request.get_json()
    new_order = Orders(
        customer_id=data['customer_id'],
        order_date=data['order_date']
    )
    db.session.add(new_order)
    db.session.commit()
    return jsonify({"message": "Order created successfully"}), 201


# GET all orders
# curl -v http://127.0.0.1:5000/orders
@app.route('/orders', methods=['GET'])
def get_orders():
    orders = Orders.query.all()
    schema = OrderSchema(many=True)
    return jsonify(schema.dump(orders)), 200


# GET order by ID
# curl -v http://127.0.0.1:5000/order/1
@app.route('/order/<int:id>', methods=['GET'])
def get_order(id):
    order = Orders.query.get(id)
    if order:
        schema = OrderSchema()
        return jsonify(schema.dump(order)), 200
    else:
        return jsonify({"message": "Order not found"}), 404


# UPDATE order
# curl -X PUT http://127.0.0.1:5000/order/1 -H "Content-Type: application/json" -d "{\"order_date\":\"2025-10-31\"}"
@app.route('/order/<int:id>', methods=['PUT'])
def update_order(id):
    order = Orders.query.get(id)
    if order:
        data = request.get_json()
        order.customer_id = data.get('customer_id', order.customer_id)
        order.order_date = data.get('order_date', order.order_date)
        db.session.commit()
        return jsonify({"message": "Order updated successfully"}), 200
    else:
        return jsonify({"message": "Order not found"}), 404


# DELETE order
# curl -X DELETE http://127.0.0.1:5000/order/1
@app.route('/order/<int:id>', methods=['DELETE'])
def delete_order(id):
    order = Orders.query.get(id)
    if order:
        db.session.delete(order)
        db.session.commit()
        return jsonify({"message": "Order deleted successfully"}), 200
    else:
        return jsonify({"message": "Order not found"}), 404

# ======================================================
# OrderDetail Endpoints
# ======================================================

# CREATE order detail
# curl -X POST http://127.0.0.1:5000/orderdetail -H "Content-Type: application/json" -d "{\"order_id\":1,\"product_id\":3,\"quantity\":2}"
@app.route('/orderdetail', methods=['POST'])
def create_order_detail():
    data = request.get_json()
    new_detail = OrderDetail(
        order_id=data['order_id'],
        product_id=data['product_id'],
        quantity=data['quantity']
    )
    db.session.add(new_detail)
    db.session.commit()
    return jsonify({"message": "Order detail added successfully"}), 201


# GET all order details
# curl -v http://127.0.0.1:5000/orderdetails
@app.route('/orderdetails', methods=['GET'])
def get_order_details():
    details = OrderDetail.query.all()
    results = [
        {
            "order_id": d.order_id,
            "product_id": d.product_id,
            "quantity": d.quantity
        } for d in details
    ]
    return jsonify(results), 200


# DELETE specific order detail
# curl -X DELETE http://127.0.0.1:5000/orderdetail/1/3
@app.route('/orderdetail/<int:order_id>/<int:product_id>', methods=['DELETE'])
def delete_order_detail(order_id, product_id):
    detail = OrderDetail.query.get((order_id, product_id))
    if detail:
        db.session.delete(detail)
        db.session.commit()
        return jsonify({"message": "Order detail deleted successfully"}), 200
    else:
        return jsonify({"message": "Order detail not found"}), 404

# ======================================================
# Shipment Endpoints
# ======================================================

# CREATE shipment
# curl -X POST http://127.0.0.1:5000/shipment -H "Content-Type: application/json" -d "{\"order_id\":1,\"courier\":\"Servientrega\",\"status\":\"Pending\"}"
@app.route('/shipment', methods=['POST'])
def create_shipment():
    data = request.get_json()
    new_shipment = Shipment(
        order_id=data['order_id'],
        courier=data.get('courier', 'Servientrega'),
        status=data.get('status', 'Pending')
    )
    db.session.add(new_shipment)
    db.session.commit()
    return jsonify({"message": "Shipment created successfully"}), 201


# GET all shipments
# curl -v http://127.0.0.1:5000/shipments
@app.route('/shipments', methods=['GET'])
def get_shipments():
    shipments = Shipment.query.all()
    schema = ShipmentSchema(many=True)
    return jsonify(schema.dump(shipments)), 200


# UPDATE shipment status
# curl -X PUT http://127.0.0.1:5000/shipment/1 -H "Content-Type: application/json" -d "{\"status\":\"Delivered\"}"
@app.route('/shipment/<int:id>', methods=['PUT'])
def update_shipment(id):
    shipment = Shipment.query.get(id)
    if shipment:
        data = request.get_json()
        shipment.courier = data.get('courier', shipment.courier)
        shipment.status = data.get('status', shipment.status)
        db.session.commit()
        return jsonify({"message": "Shipment updated successfully"}), 200
    else:
        return jsonify({"message": "Shipment not found"}), 404


# DELETE shipment
# curl -X DELETE http://127.0.0.1:5000/shipment/1
@app.route('/shipment/<int:id>', methods=['DELETE'])
def delete_shipment(id):
    shipment = Shipment.query.get(id)
    if shipment:
        db.session.delete(shipment)
        db.session.commit()
        return jsonify({"message": "Shipment deleted successfully"}), 200
    else:
        return jsonify({"message": "Shipment not found"}), 404



# ======================================================
# Run App
# ======================================================
if __name__ == "__main__":
    app.run(debug=True)