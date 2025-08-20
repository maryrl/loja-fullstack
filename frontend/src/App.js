import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingCart, 
  User, 
  Plus, 
  Minus, 
  X, 
  Menu, 
  Search, 
  Star,
  Truck,
  Shield,
  ArrowRight,
  Settings,
  Package,
  BarChart3,
  Users,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for authentication and cart
const AppContext = createContext();

// Mock initial products for demo
const INITIAL_PRODUCTS = [
  {
    id: '1',
    name: 'Urban Hoodie Black',
    description: 'Hoodie urbano premium com estilo streetwear moderno',
    price: 159.90,
    category: 'hoodies',
    size: 'M',
    color: 'black',
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHN0cmVldHdlYXJ8ZW58MHx8fHwxNzU1NjUxODk2fDA&ixlib=rb-4.1.0&q=85'
  },
  {
    id: '2',
    name: 'Streetwear Jacket',
    description: 'Jaqueta urban style com design contemporâneo',
    price: 289.90,
    category: 'jackets',
    size: 'L',
    color: 'black',
    stock: 8,
    image_url: 'https://images.unsplash.com/photo-1613372281199-ec69ace5e926?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHx1cmJhbiUyMHN0cmVldHdlYXJ8ZW58MHx8fHwxNzU1NjUxODk2fDA&ixlib=rb-4.1.0&q=85'
  },
  {
    id: '3',
    name: 'Urban Denim',
    description: 'Calça jeans com corte moderno e lavagem urban',
    price: 189.90,
    category: 'pants',
    size: 'M',
    color: 'blue',
    stock: 12,
    image_url: 'https://images.unsplash.com/photo-1613372281451-9857222384d9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwzfHx1cmJhbiUyMHN0cmVldHdlYXJ8ZW58MHx8fHwxNzU1NjUxODk2fDA&ixlib=rb-4.1.0&q=85'
  },
  {
    id: '4',
    name: 'Street Sneakers',
    description: 'Tênis urbano com design exclusivo',
    price: 249.90,
    category: 'shoes',
    size: '42',
    color: 'white',
    stock: 20,
    image_url: 'https://images.unsplash.com/flagged/photo-1564723150667-e0c8d8ea3246?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHx1cmJhbiUyMHN0cmVldHdlYXJ8ZW58MHx8fHwxNzU1NjUxODk2fDA&ixlib=rb-4.1.0&q=85'
  },
  {
    id: '5',
    name: 'Urban Cap',
    description: 'Boné snapback com estilo urban autêntico',
    price: 79.90,
    category: 'accessories',
    size: 'unique',
    color: 'black',
    stock: 25,
    image_url: 'https://images.pexels.com/photos/33505580/pexels-photo-33505580.jpeg'
  },
  {
    id: '6',
    name: 'Street Backpack',
    description: 'Mochila urban com múltiplos compartimentos',
    price: 199.90,
    category: 'accessories',
    size: 'unique',
    color: 'gray',
    stock: 10,
    image_url: 'https://images.pexels.com/photos/33501236/pexels-photo-33501236.jpeg'
  }
];

// Components
const Header = () => {
  const { user, cart, logout, toggleMobileMenu } = useContext(AppContext);
  const navigate = useNavigate();
  
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')}>
            <h1>URBAN THREADS</h1>
            <span>streetwear</span>
          </div>
          
          <nav className="nav-desktop">
            <a href="#" onClick={() => navigate('/')}>Home</a>
            <a href="#" onClick={() => navigate('/products')}>Produtos</a>
            <a href="#about">Sobre</a>
            <a href="#contact">Contato</a>
          </nav>
          
          <div className="header-actions">
            <button className="search-btn">
              <Search size={20} />
            </button>
            
            <button className="cart-btn" onClick={() => navigate('/cart')}>
              <ShoppingCart size={20} />
              {cartItemsCount > 0 && <span className="cart-count">{cartItemsCount}</span>}
            </button>
            
            {user ? (
              <div className="user-menu">
                <button className="user-btn" onClick={() => navigate('/account')}>
                  <User size={20} />
                  <span>{user.name}</span>
                </button>
                {user.is_admin && (
                  <button className="admin-btn" onClick={() => navigate('/admin')}>
                    <Settings size={20} />
                    Admin
                  </button>
                )}
                <button className="logout-btn" onClick={logout}>Sair</button>
              </div>
            ) : (
              <button className="login-btn" onClick={() => navigate('/login')}>
                <User size={20} />
                Login
              </button>
            )}
            
            <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="hero">
      <div className="hero-bg">
        <img src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHN0cmVldHdlYXJ8ZW58MHx8fHwxNzU1NjUxODk2fDA&ixlib=rb-4.1.0&q=85" alt="Urban Fashion" />
        <div className="hero-overlay"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-line">URBAN</span>
            <span className="title-line">STREETWEAR</span>
            <span className="title-accent">COLLECTION</span>
          </h1>
          
          <p className="hero-description">
            Descubra a nova coleção de roupas urbanas com estilo autêntico e qualidade premium. 
            Peças exclusivas para quem vive a cultura street.
          </p>
          
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/products')}>
              Explorar Coleção
              <ArrowRight size={20} />
            </button>
            
            <button className="btn btn-secondary">
              Ver Lookbook
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const ProductCard = ({ product, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState(product.size);
  const [selectedColor, setSelectedColor] = useState(product.color);

  const handleAddToCart = () => {
    onAddToCart({
      product_id: product.id,
      quantity: 1,
      size: selectedSize,
      color: selectedColor
    });
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.image_url} alt={product.name} />
        <div className="product-overlay">
          <button className="btn btn-primary" onClick={handleAddToCart}>
            <Plus size={16} />
            Adicionar
          </button>
        </div>
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        
        <div className="product-options">
          <div className="size-options">
            <span>Tamanho: {selectedSize}</span>
          </div>
          <div className="color-options">
            <span>Cor: {selectedColor}</span>
          </div>
        </div>
        
        <div className="product-price">
          <span className="price">R$ {product.price.toFixed(2)}</span>
          <span className="stock">{product.stock} em estoque</span>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { products, addToCart } = useContext(AppContext);
  const navigate = useNavigate();
  
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="home">
      <Hero />
      
      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <Truck size={32} />
              <h3>Entrega Rápida</h3>
              <p>Frete grátis acima de R$ 200</p>
            </div>
            <div className="feature-card">
              <Shield size={32} />
              <h3>Compra Segura</h3>
              <p>Pagamento 100% seguro</p>
            </div>
            <div className="feature-card">
              <Star size={32} />
              <h3>Qualidade Premium</h3>
              <p>Produtos de alta qualidade</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="featured-products">
        <div className="container">
          <h2 className="section-title">Produtos em Destaque</h2>
          <div className="products-grid">
            {featuredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={addToCart}
              />
            ))}
          </div>
          <div className="section-actions">
            <button className="btn btn-outline" onClick={() => navigate('/products')}>
              Ver Todos os Produtos
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const Products = () => {
  const { products, addToCart } = useContext(AppContext);
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [products, selectedCategory]);

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'hoodies', name: 'Moletons' },
    { id: 'jackets', name: 'Jaquetas' },
    { id: 'pants', name: 'Calças' },
    { id: 'shoes', name: 'Calçados' },
    { id: 'accessories', name: 'Acessórios' }
  ];

  return (
    <div className="products-page">
      <div className="container">
        <h1 className="page-title">Nossa Coleção</h1>
        
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        <div className="products-grid">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={addToCart}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, products } = useContext(AppContext);
  const navigate = useNavigate();
  
  const getProductDetails = (productId) => {
    return products.find(p => p.id === productId);
  };
  
  const total = cart.reduce((sum, item) => {
    const product = getProductDetails(item.product_id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <div className="container">
          <h2>Seu carrinho está vazio</h2>
          <p>Adicione alguns produtos incríveis da nossa coleção!</p>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>
            Explorar Produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">Carrinho de Compras</h1>
        
        <div className="cart-content">
          <div className="cart-items">
            {cart.map((item, index) => {
              const product = getProductDetails(item.product_id);
              if (!product) return null;
              
              return (
                <div key={index} className="cart-item">
                  <img src={product.image_url} alt={product.name} />
                  <div className="item-details">
                    <h3>{product.name}</h3>
                    <p>Tamanho: {item.size} | Cor: {item.color}</p>
                    <span className="item-price">R$ {product.price.toFixed(2)}</span>
                  </div>
                  <div className="quantity-controls">
                    <button onClick={() => updateCartItem(item.product_id, Math.max(1, item.quantity - 1))}>
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateCartItem(item.product_id, item.quantity + 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(item.product_id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
          
          <div className="cart-summary">
            <h3>Resumo do Pedido</h3>
            <div className="summary-line">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Frete</span>
              <span>{total > 200 ? 'Grátis' : 'R$ 15,00'}</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>R$ {(total + (total > 200 ? 0 : 15)).toFixed(2)}</span>
            </div>
            <button className="btn btn-primary btn-full" onClick={handleCheckout}>
              Finalizar Compra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  const { cart, products, user } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [userName, setUserName] = useState(user?.name || '');
  const navigate = useNavigate();
  
  const total = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.product_id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  const handlePayment = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/payments/checkout/session`, {
        origin_url: window.location.origin,
        items: cart,
        user_email: userEmail,
        user_name: userName
      });
      
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">Finalizar Compra</h1>
        
        <div className="checkout-content">
          <div className="checkout-form">
            <h3>Informações do Cliente</h3>
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
          </div>
          
          <div className="order-summary">
            <h3>Resumo do Pedido</h3>
            {cart.map((item, index) => {
              const product = products.find(p => p.id === item.product_id);
              if (!product) return null;
              
              return (
                <div key={index} className="order-item">
                  <span>{product.name} (x{item.quantity})</span>
                  <span>R$ {(product.price * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
            
            <div className="order-total">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            
            <button 
              className="btn btn-primary btn-full"
              onClick={handlePayment}
              disabled={loading || !userName || !userEmail}
            >
              {loading ? 'Processando...' : 'Pagar com Stripe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AppContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const response = await axios.post(`${API}/auth/register`, {
          email,
          password,
          name
        });
        localStorage.setItem('token', response.data.access_token);
        await login(email, password);
      }
      navigate('/');
    } catch (error) {
      alert(isLogin ? 'Erro no login' : 'Erro no cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-form">
          <h2>{isLogin ? 'Login' : 'Cadastro'}</h2>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            </button>
          </form>
          
          <p className="auth-switch">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
            <button onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  const { user, products, setProducts } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user?.is_admin) {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [dashboardRes, ordersRes] = await Promise.all([
        axios.get(`${API}/admin/dashboard`, { headers }),
        axios.get(`${API}/admin/orders`, { headers })
      ]);
      
      setStats(dashboardRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  if (!user?.is_admin) {
    return <div>Acesso negado</div>;
  }

  return (
    <div className="admin-page">
      <div className="container">
        <h1>Painel Administrativo</h1>
        
        <div className="admin-tabs">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={16} />
            Dashboard
          </button>
          <button 
            className={activeTab === 'products' ? 'active' : ''} 
            onClick={() => setActiveTab('products')}
          >
            <Package size={16} />
            Produtos
          </button>
          <button 
            className={activeTab === 'orders' ? 'active' : ''} 
            onClick={() => setActiveTab('orders')}
          >
            <Truck size={16} />
            Pedidos
          </button>
        </div>
        
        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard">
              <div className="stats-grid">
                <div className="stat-card">
                  <Package size={24} />
                  <div>
                    <h3>{stats.total_products || 0}</h3>
                    <p>Produtos</p>
                  </div>
                </div>
                <div className="stat-card">
                  <Truck size={24} />
                  <div>
                    <h3>{stats.total_orders || 0}</h3>
                    <p>Pedidos</p>
                  </div>
                </div>
                <div className="stat-card">
                  <BarChart3 size={24} />
                  <div>
                    <h3>R$ {(stats.total_revenue || 0).toFixed(2)}</h3>
                    <p>Receita</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'products' && (
            <div className="products-admin">
              <div className="admin-header">
                <h2>Gerenciar Produtos</h2>
                <button className="btn btn-primary">
                  <Plus size={16} />
                  Novo Produto
                </button>
              </div>
              
              <div className="products-table">
                {products.map(product => (
                  <div key={product.id} className="product-row">
                    <img src={product.image_url} alt={product.name} />
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p>R$ {product.price.toFixed(2)} | Estoque: {product.stock}</p>
                    </div>
                    <div className="product-actions">
                      <button className="btn-icon">
                        <Eye size={16} />
                      </button>
                      <button className="btn-icon">
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'orders' && (
            <div className="orders-admin">
              <h2>Gerenciar Pedidos</h2>
              <div className="orders-table">
                {orders.map(order => (
                  <div key={order.id} className="order-row">
                    <div className="order-info">
                      <h3>Pedido #{order.id.substring(0, 8)}</h3>
                      <p>{order.user_name} | {order.user_email}</p>
                      <p>R$ {order.total_amount.toFixed(2)}</p>
                    </div>
                    <div className="order-status">
                      <span className={`status ${order.status}`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentSuccess = () => {
  const [status, setStatus] = useState('checking');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, [location]);

  const checkPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/checkout/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
      } else if (response.data.status === 'expired') {
        setStatus('expired');
      } else {
        setTimeout(() => checkPaymentStatus(sessionId, attempts + 1), 2000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
    }
  };

  return (
    <div className="payment-result">
      <div className="container">
        {status === 'checking' && (
          <div className="result-content">
            <h2>Verificando pagamento...</h2>
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="result-content success">
            <h2>Pagamento realizado com sucesso!</h2>
            <p>Obrigado pela sua compra. Você receberá um email de confirmação em breve.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Continuar Comprando
            </button>
          </div>
        )}
        
        {(status === 'expired' || status === 'error' || status === 'timeout') && (
          <div className="result-content error">
            <h2>Erro no pagamento</h2>
            <p>Houve um problema com seu pagamento. Tente novamente.</p>
            <button className="btn btn-primary" onClick={() => navigate('/cart')}>
              Voltar ao Carrinho
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>URBAN THREADS</h3>
            <p>Streetwear urbano autêntico para quem vive a cultura street.</p>
          </div>
          
          <div className="footer-section">
            <h4>Links Rápidos</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/products">Produtos</a></li>
              <li><a href="#about">Sobre</a></li>
              <li><a href="#contact">Contato</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Atendimento</h4>
            <ul>
              <li><a href="#">Política de Troca</a></li>
              <li><a href="#">Frete e Entrega</a></li>
              <li><a href="#">Dúvidas</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Contato</h4>
            <p>contato@urbanthreads.com</p>
            <p>(11) 99999-9999</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Urban Threads. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

// Main App Component
const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check for stored token
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    }
    
    // Load products from API
    loadProducts();
    
    // Check for payment result
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      // Clear cart on successful payment
      setCart([]);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      if (response.data.length > 0) {
        setProducts(response.data);
      }
    } catch (error) {
      console.log('Using initial products');
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const token = response.data.access_token;
    localStorage.setItem('token', token);
    await fetchUser(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCart([]);
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existingItem = prev.find(
        cartItem => cartItem.product_id === item.product_id && 
                   cartItem.size === item.size && 
                   cartItem.color === item.color
      );
      
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.product_id === item.product_id && 
          cartItem.size === item.size && 
          cartItem.color === item.color
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      }
      
      return [...prev, item];
    });
  };

  const updateCartItem = (productId, newQuantity) => {
    setCart(prev => 
      prev.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const value = {
    user,
    products,
    setProducts,
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    login,
    logout,
    mobileMenuOpen,
    toggleMobileMenu
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
            
            {/* Payment Success Handler */}
            {window.location.search.includes('session_id') && <PaymentSuccess />}
          </main>
          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;