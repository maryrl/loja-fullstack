from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Urban Threads E-commerce API")
api_router = APIRouter(prefix="/api")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Stripe Setup
stripe_api_key = os.environ.get('STRIPE_API_KEY')

# SendGrid Setup
sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
sender_email = os.environ.get('SENDER_EMAIL', 'noreply@urbanthreads.com')

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    password_hash: str
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    size: str
    color: str
    stock: int
    image_url: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    size: str
    color: str
    stock: int
    image_url: str

class CartItem(BaseModel):
    product_id: str
    quantity: int
    size: str
    color: str

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: str
    user_name: str
    items: List[Dict[str, Any]]
    total_amount: float
    status: str = "pending"
    payment_status: str = "pending"
    session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    amount: float
    currency: str = "brl"
    status: str = "pending"
    payment_status: str = "pending"
    metadata: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    origin_url: str
    items: List[CartItem]
    user_email: Optional[str] = None
    user_name: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return User(**user)

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def send_email(to: str, subject: str, content: str):
    try:
        message = Mail(
            from_email=sender_email,
            to_emails=to,
            subject=subject,
            html_content=content
        )
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        return response.status_code == 202
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")
        return False

def send_order_confirmation_email(user_email: str, user_name: str, order_id: str, items: List[Dict], total: float):
    items_html = ""
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{item['name']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{item['size']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{item['color']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{item['quantity']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">R$ {item['price']:.2f}</td>
        </tr>
        """
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2c3e50; text-align: center;">Urban Threads</h1>
                <h2 style="color: #34495e;">Confirmação de Pedido</h2>
                <p>Olá {user_name},</p>
                <p>Seu pedido foi confirmado! Obrigado por comprar na Urban Threads.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>Detalhes do Pedido #{order_id}</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #e9ecef;">
                                <th style="padding: 10px; text-align: left;">Produto</th>
                                <th style="padding: 10px; text-align: left;">Tamanho</th>
                                <th style="padding: 10px; text-align: left;">Cor</th>
                                <th style="padding: 10px; text-align: left;">Qtd</th>
                                <th style="padding: 10px; text-align: left;">Preço</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                    <div style="text-align: right; margin-top: 15px; font-size: 18px; font-weight: bold;">
                        Total: R$ {total:.2f}
                    </div>
                </div>
                
                <p>Você receberá uma nova notificação quando seu pedido for enviado.</p>
                <p>Obrigado por escolher a Urban Threads!</p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 14px;">Urban Threads - Streetwear Urbano</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(user_email, f"Confirmação de Pedido #{order_id}", html_content)

# Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hashed_password,
        is_admin=(user_data.email == "admin@urbanthreads.com")  # Make first admin
    )
    
    await db.users.insert_one(user.dict())
    
    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Products
@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, limit: int = 50, skip: int = 0):
    query = {}
    if category:
        query["category"] = category
    
    products = await db.products.find(query).skip(skip).limit(limit).to_list(length=None)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_admin: User = Depends(get_current_admin_user)):
    product = Product(**product_data.dict())
    await db.products.insert_one(product.dict())
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, current_admin: User = Depends(get_current_admin_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = Product(id=product_id, **product_data.dict())
    await db.products.replace_one({"id": product_id}, updated_product.dict())
    return updated_product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_admin: User = Depends(get_current_admin_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# Cart
@api_router.get("/cart", response_model=Cart)
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id})
    if not cart:
        cart = Cart(user_id=current_user.id, items=[])
        await db.carts.insert_one(cart.dict())
    return Cart(**cart)

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id})
    if not cart:
        cart = Cart(user_id=current_user.id, items=[])
    else:
        cart = Cart(**cart)
    
    # Check if item already exists
    for existing_item in cart.items:
        if (existing_item.product_id == item.product_id and 
            existing_item.size == item.size and 
            existing_item.color == item.color):
            existing_item.quantity += item.quantity
            break
    else:
        cart.items.append(item)
    
    await db.carts.replace_one({"user_id": current_user.id}, cart.dict(), upsert=True)
    return {"message": "Item added to cart"}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id})
    if cart:
        cart = Cart(**cart)
        cart.items = [item for item in cart.items if item.product_id != product_id]
        await db.carts.replace_one({"user_id": current_user.id}, cart.dict())
    return {"message": "Item removed from cart"}

# Checkout & Payments
@api_router.post("/payments/checkout/session")
async def create_checkout_session(request: CheckoutRequest, http_request: Request):
    # Calculate total amount
    total_amount = 0.0
    order_items = []
    
    for cart_item in request.items:
        product = await db.products.find_one({"id": cart_item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {cart_item.product_id} not found")
        
        if product["stock"] < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        item_total = product["price"] * cart_item.quantity
        total_amount += item_total
        
        order_items.append({
            "product_id": cart_item.product_id,
            "name": product["name"],
            "price": product["price"],
            "quantity": cart_item.quantity,
            "size": cart_item.size,
            "color": cart_item.color
        })
    
    # Setup Stripe
    host_url = str(http_request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Create URLs
    success_url = f"{request.origin_url}/?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/?payment=cancelled"
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=total_amount,
        currency="brl",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_email": request.user_email or "guest",
            "user_name": request.user_name or "Guest",
            "items": json.dumps(order_items)
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction
    transaction = PaymentTransaction(
        session_id=session.session_id,
        user_email=request.user_email,
        amount=total_amount,
        currency="brl",
        metadata={
            "user_email": request.user_email or "guest",
            "user_name": request.user_name or "Guest",
            "items": json.dumps(order_items)
        }
    )
    
    await db.payment_transactions.insert_one(transaction.dict())
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, background_tasks: BackgroundTasks):
    # Get transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Setup Stripe
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    # Get status from Stripe
    status_response = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "status": status_response.status,
                "payment_status": status_response.payment_status
            }
        }
    )
    
    # If paid, create order and send email
    if status_response.payment_status == "paid" and transaction["payment_status"] != "paid":
        items = json.loads(transaction["metadata"]["items"])
        user_email = transaction["metadata"]["user_email"]
        user_name = transaction["metadata"]["user_name"]
        
        # Create order
        order = Order(
            user_email=user_email,
            user_name=user_name,
            items=items,
            total_amount=transaction["amount"],
            status="confirmed",
            payment_status="paid",
            session_id=session_id
        )
        
        await db.orders.insert_one(order.dict())
        
        # Update product stock
        for item in items:
            await db.products.update_one(
                {"id": item["product_id"]},
                {"$inc": {"stock": -item["quantity"]}}
            )
        
        # Send confirmation email
        if user_email != "guest":
            background_tasks.add_task(
                send_order_confirmation_email,
                user_email,
                user_name,
                order.id,
                items,
                transaction["amount"]
            )
    
    return status_response

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    webhook_response = await stripe_checkout.handle_webhook(body, signature)
    
    return {"received": True}

# Admin Routes
@api_router.get("/admin/dashboard")
async def get_admin_dashboard(current_admin: User = Depends(get_current_admin_user)):
    # Get stats
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_revenue = 0
    
    # Calculate revenue
    orders = await db.orders.find({"payment_status": "paid"}).to_list(length=None)
    total_revenue = sum(order["total_amount"] for order in orders)
    
    # Recent orders
    recent_orders = await db.orders.find().sort("created_at", -1).limit(10).to_list(length=None)
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "recent_orders": recent_orders
    }

@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(current_admin: User = Depends(get_current_admin_user), limit: int = 50, skip: int = 0):
    orders = await db.orders.find().sort("created_at", -1).skip(skip).limit(limit).to_list(length=None)
    return [Order(**order) for order in orders]

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_admin: User = Depends(get_current_admin_user)):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

# Health check
@api_router.get("/")
async def root():
    return {"message": "Urban Threads API is running!"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()