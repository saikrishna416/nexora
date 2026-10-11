import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Star,
  Zap,
} from "lucide-react";
import api from "../services/api";

const departments = [
  {
    name: "Electronics",
    label: "Electronics & gadgets",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80",
  },
  {
    name: "Men's Fashion",
    label: "Style for him",
    category: "Men's Fashion",
    image: "https://img.magnific.com/free-photo/retro-man-dressed-shirt-lies-floor-posing_171337-9906.jpg?semt=ais_hybrid&w=740&q=80",
  },
  {
    name: "Women's Fashion",
    label: "New-season looks",
    category: "Women's Fashion",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&q=80",
  },
  {
    name: "Home & Living",
    label: "Make yourself at home",
    category: "Home & Living",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=700&q=80",
  },
  {
    name: "Beauty & Personal Care",
    label: "Everyday essentials",
    category: "Beauty & Personal Care",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=700&q=80",
  },
  {
    name: "Sports & Fitness",
    label: "Move more",
    category: "Sports & Fitness",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=700&q=80",
  },
  {
    name: "Kids",
    label: "Little things, big smiles",
    category: "Kids",
    image: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=700&q=80",
  },
  {
    name: "Appliances",
    label: "Upgrade your home",
    category: "Appliances",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=700&q=80",
  },
];

const heroSlides = [
  {
    kicker: "THE NEXORA EVERYDAY EVENT",
    title: "Good finds. Great everyday.",
    subtitle: "Explore tech, style, home essentials and more—all in one place.",
    button: "Shop all products",
    background:
      "linear-gradient(105deg, #102a43 0%, #145b66 48%, #d5e9df 100%)",
    color: "#ffffff",
    accent: "#baf3df",
  },
  {
    kicker: "LEVEL UP YOUR SETUP",
    title: "A little more wow.",
    subtitle: "Discover useful tech and accessories for work, play and everything between.",
    button: "Explore electronics",
    background:
      "linear-gradient(105deg, #172554 0%, #334e8a 55%, #c7d8f5 100%)",
    color: "#ffffff",
    accent: "#dbeafe",
    category: "Electronics",
  },
  {
    kicker: "MAKE ROOM FOR COMFORT",
    title: "Refresh your space.",
    subtitle: "Thoughtful home picks that make everyday living feel better.",
    button: "Shop home & living",
    background:
      "linear-gradient(105deg, #5b3528 0%, #b66e4c 52%, #f6dfc9 100%)",
    color: "#ffffff",
    accent: "#ffead8",
    category: "Home & Living",
  },
];


function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .get("/products/?page_size=100")
      .then((response) => {
        const data = response.data?.results ?? response.data;
        if (active) setProducts(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Failed to load home products:", error);
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const popularProducts = useMemo(() => products.slice(0, 8), [products]);
  const dealProducts = useMemo(() => {
    const inStock = products.filter((product) => Number(product.stock ?? 1) > 0);
    return (inStock.length ? inStock : products).slice(0, 8);
  }, [products]);

  const openDepartment = (category) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  const slide = heroSlides[activeSlide];

  return (
    <main className="nx-home">
      <style>{homeStyles}</style>

      <div className="nx-benefits-bar">
        <span><Truck size={15} /> Convenient delivery</span>
        <span><ShieldCheck size={15} /> Secure checkout</span>
        <span><RotateCcw size={15} /> Easy order support</span>
        <span><Headphones size={15} /> Here when you need us</span>
      </div>

      <section className="nx-hero" style={{ background: slide.background, color: slide.color }}>
        <div className="nx-hero-copy">
          <span className="nx-eyebrow" style={{ color: slide.accent }}>{slide.kicker}</span>
          <h1>{slide.title}</h1>
          <p>{slide.subtitle}</p>
          <button
            className="nx-hero-cta"
            onClick={() => slide.category ? openDepartment(slide.category) : navigate("/products")}
          >
            {slide.button} <ArrowRight size={17} />
          </button>
          <div className="nx-hero-controls">
            <button type="button" aria-label="Previous promotion" onClick={() => setActiveSlide((activeSlide - 1 + heroSlides.length) % heroSlides.length)}><ChevronLeft size={18} /></button>
            {heroSlides.map((item, index) => (
              <button
                type="button"
                key={item.title}
                aria-label={`Show promotion ${index + 1}`}
                className={`nx-hero-dot ${activeSlide === index ? "is-active" : ""}`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
            <button type="button" aria-label="Next promotion" onClick={() => setActiveSlide((activeSlide + 1) % heroSlides.length)}><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="nx-hero-art" aria-hidden="true">
          <div className="nx-hero-orbit nx-orbit-one" />
          <div className="nx-hero-orbit nx-orbit-two" />
          <div className="nx-hero-product-card">
            <span className="nx-art-spark"><Zap size={22} fill="currentColor" /></span>
            <div className="nx-art-circle"><span>N</span></div>
            <strong>Discover more.</strong>
            <small>Find your next favourite</small>
          </div>
          <span className="nx-floating-pill nx-pill-top">Everyday favourites</span>
          <span className="nx-floating-pill nx-pill-bottom">Picked for you</span>
        </div>
      </section>

      <section className="nx-quick-links" aria-label="Shopping benefits">
        <div><span className="nx-quick-icon">01</span><div><strong>Find your fit</strong><small>Shop across departments</small></div></div>
        <div><span className="nx-quick-icon">02</span><div><strong>Compare your picks</strong><small>Explore the details</small></div></div>
        <div><span className="nx-quick-icon">03</span><div><strong>Shop with confidence</strong><small>Simple, secure checkout</small></div></div>
      </section>

      <section className="nx-section nx-departments-section">
        <div className="nx-section-heading">
          <div><span className="nx-section-kicker">EXPLORE NEXORA</span><h2>Shop by department</h2><p>A good place to start.</p></div>
          <Link to="/products" className="nx-text-link">View all products <ArrowRight size={16} /></Link>
        </div>
        <div className="nx-department-grid">
          {departments.map((department, index) => (
            <button className="nx-department-card" key={department.name} onClick={() => openDepartment(department.category)}>
              <div className="nx-department-image-wrap">
                <img src={department.image} alt="" loading="lazy" />
                <span className="nx-department-number">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <span className="nx-department-label">{department.label}</span>
              <strong>{department.name}</strong>
              <span className="nx-department-arrow"><ArrowRight size={16} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="nx-deal-banner">
        <div className="nx-deal-icon"><Zap size={24} /></div>
        <div><span>GOOD FINDS, RIGHT NOW</span><h2>Everyday deals worth a look.</h2><p>Browse the catalogue and discover something useful.</p></div>
        <button onClick={() => navigate("/products")}>Explore products <ArrowRight size={17} /></button>
      </section>

      <section className="nx-section">
        <div className="nx-section-heading">
          <div><span className="nx-section-kicker">A FEW IDEAS TO GET YOU STARTED</span><h2>Popular picks</h2><p>Explore products from the Nexora catalogue.</p></div>
          <Link to="/products" className="nx-text-link">Shop all <ArrowRight size={16} /></Link>
        </div>
        {loadingProducts ? (
          <div className="nx-product-placeholder">Loading products for you…</div>
        ) : popularProducts.length ? (
          <div className="nx-product-grid">
            {popularProducts.map((product) => (
              <button className="nx-product-card" key={product.id} onClick={() => navigate(`/products/${product.id}`)}>
                <div className="nx-product-image">
                  {product.image ? <img src={product.image} alt={product.name || "Product"} loading="lazy" /> : <span className="nx-no-image">NEXORA</span>}
                  {Number(product.stock ?? 1) > 0 && <span className="nx-stock-badge">Available</span>}
                </div>
                <div className="nx-product-info">
                  <span className="nx-product-category">{product.category_name || "Nexora collection"}</span>
                  <strong>{product.name}</strong>
                  <span className="nx-product-price">₹{product.price}</span>
                  {product.average_rating != null && <span className="nx-product-rating"><Star size={13} fill="currentColor" /> {Number(product.average_rating).toFixed(1)} {product.review_count ? `(${product.review_count})` : ""}</span>}
                  <span className="nx-product-link">View details <ArrowRight size={14} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="nx-product-placeholder">Products will appear here once they are available in the catalogue. <Link to="/products">Browse products</Link></div>
        )}
      </section>

      <section className="nx-section nx-deals-section">
        <div className="nx-section-heading">
          <div><span className="nx-section-kicker">MORE TO DISCOVER</span><h2>Available now</h2><p>Keep browsing and find your next everyday essential.</p></div>
          <Link to="/products" className="nx-text-link">See everything <ArrowRight size={16} /></Link>
        </div>
        {loadingProducts ? (
          <div className="nx-product-placeholder">Finding more products…</div>
        ) : dealProducts.length ? (
          <div className="nx-deal-list">
            {dealProducts.slice(0, 4).map((product) => (
              <button className="nx-deal-item" key={product.id} onClick={() => navigate(`/products/${product.id}`)}>
                <div>{product.image ? <img src={product.image} alt="" loading="lazy" /> : <span className="nx-no-image">N</span>}</div>
                <span className="nx-deal-item-copy"><small>{product.category_name || "Featured"}</small><strong>{product.name}</strong><b>₹{product.price}</b><em>View product <ArrowRight size={13} /></em></span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <footer className="nx-home-footer">
        <Link to="/" className="nx-footer-brand">Nexora<span>.</span></Link>
        <p>Shop smarter. Live better.</p>
        <div><Link to="/products">All products</Link><Link to="/orders">Your orders</Link><Link to="/wishlist">Wishlist</Link><Link to="/cart">Shopping cart</Link></div>
        <small>© {new Date().getFullYear()} Nexora. All rights reserved.</small>
      </footer>
    </main>
  );
}

const homeStyles = `
.nx-home{background:#f4f6f8;color:#18212f;min-height:100vh;font-family:Arial,Helvetica,sans-serif}
.nx-benefits-bar{display:flex;justify-content:center;align-items:center;gap:clamp(16px,4vw,56px);padding:12px 20px;background:#fff;border-bottom:1px solid #e7ebef;color:#465363;font-size:12px;flex-wrap:wrap}
.nx-benefits-bar span{display:flex;align-items:center;gap:7px}.nx-benefits-bar svg{color:#0f766e}
.nx-hero{min-height:350px;margin:18px auto 0;max-width:1500px;padding:clamp(28px,5vw,66px) clamp(22px,6vw,84px);display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:28px;overflow:hidden;position:relative;box-sizing:border-box}
.nx-hero-copy{position:relative;z-index:2;max-width:600px}.nx-eyebrow,.nx-section-kicker{font-size:10px;font-weight:800;letter-spacing:2px}
.nx-hero h1{font-size:clamp(36px,5vw,62px);line-height:1.03;letter-spacing:-2px;margin:16px 0;max-width:620px}
.nx-hero p{font-size:16px;line-height:1.7;max-width:490px;opacity:.9;margin:0 0 25px}
.nx-hero-cta{display:inline-flex;align-items:center;gap:12px;padding:13px 18px;border:0;border-radius:5px;background:#fff;color:#172b3a;font-weight:800;font-size:13px;cursor:pointer}
.nx-hero-controls{display:flex;align-items:center;gap:9px;margin-top:34px}.nx-hero-controls>button:not(.nx-hero-dot){display:grid;place-items:center;width:30px;height:30px;border:1px solid #ffffff88;border-radius:50%;background:transparent;color:inherit;cursor:pointer}
.nx-hero-dot{height:7px;width:7px;border:0;border-radius:9px;background:#ffffff80;padding:0;cursor:pointer}.nx-hero-dot.is-active{width:24px;background:#fff}
.nx-hero-art{height:270px;position:relative;display:grid;place-items:center}.nx-hero-orbit{position:absolute;border:1px solid #ffffff50;border-radius:50%;transform:rotate(-24deg)}.nx-orbit-one{width:330px;height:220px}.nx-orbit-two{width:270px;height:310px;transform:rotate(35deg)}
.nx-hero-product-card{width:220px;height:225px;position:relative;z-index:1;border:1px solid #ffffff75;border-radius:15px;background:#ffffff1c;backdrop-filter:blur(9px);box-shadow:0 25px 60px #0002;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;transform:rotate(5deg)}
.nx-art-circle{width:92px;height:92px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#d7fff0,#6bc7b1);color:#124d4c;font-size:50px;font-weight:900;box-shadow:0 12px 25px #001b242b}.nx-art-spark{position:absolute;right:25px;top:20px;color:#fff}.nx-hero-product-card strong{font-size:16px}.nx-hero-product-card small{font-size:11px;opacity:.8}.nx-floating-pill{position:absolute;z-index:2;padding:10px 13px;border-radius:7px;background:#fff;color:#1f3541;box-shadow:0 8px 24px #0002;font-size:11px;font-weight:800}.nx-pill-top{top:25px;right:0}.nx-pill-bottom{bottom:20px;left:0}
.nx-quick-links{max-width:1320px;margin:0 auto;padding:16px 22px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.nx-quick-links>div{display:flex;align-items:center;gap:12px;padding:15px;background:#fff;border:1px solid #e8ebef;border-radius:8px}.nx-quick-icon{display:grid;place-items:center;flex-shrink:0;width:38px;height:38px;border-radius:50%;background:#e6f6f2;color:#0f766e;font-size:11px;font-weight:900}.nx-quick-links strong,.nx-quick-links small{display:block}.nx-quick-links strong{font-size:12px}.nx-quick-links small{margin-top:4px;color:#748091;font-size:11px}
.nx-section{max-width:1320px;margin:0 auto;padding:42px 22px 18px}.nx-section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px}.nx-section-kicker{color:#0f766e}.nx-section-heading h2{font-size:clamp(23px,3vw,31px);letter-spacing:-.7px;margin:7px 0}.nx-section-heading p{font-size:13px;color:#7a8491;margin:0}.nx-text-link{display:inline-flex;align-items:center;gap:7px;color:#0f766e;text-decoration:none;font-size:12px;font-weight:800;white-space:nowrap}.nx-text-link:hover{text-decoration:underline}
.nx-department-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.nx-department-card{position:relative;overflow:hidden;text-align:left;padding:0 0 17px;border:1px solid #e4e8ed;border-radius:9px;background:#fff;cursor:pointer;transition:transform .2s,box-shadow .2s}.nx-department-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px #14283d12}.nx-department-image-wrap{height:175px;position:relative;overflow:hidden;background:#e7ecef}.nx-department-image-wrap img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}.nx-department-card:hover img{transform:scale(1.04)}.nx-department-number{position:absolute;left:12px;top:12px;padding:5px 7px;border-radius:4px;background:#fffdf0ed;color:#263541;font-size:10px;font-weight:900}.nx-department-label{display:block;margin:15px 15px 5px;color:#7c8794;font-size:10px;text-transform:uppercase;letter-spacing:.8px}.nx-department-card>strong{display:block;margin:0 15px;color:#18212f;font-size:15px}.nx-department-arrow{position:absolute;right:14px;bottom:17px;color:#0f766e}
.nx-deal-banner{max-width:1276px;margin:34px auto 8px;padding:24px 28px;display:flex;align-items:center;gap:18px;background:#e1f5ef;border:1px solid #c8e8df;border-radius:9px;box-sizing:border-box}.nx-deal-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:9px;background:#0f766e;color:white;flex-shrink:0}.nx-deal-banner>div:nth-child(2){flex:1}.nx-deal-banner span{font-size:10px;font-weight:900;letter-spacing:1.3px;color:#0f766e}.nx-deal-banner h2{font-size:21px;margin:5px 0}.nx-deal-banner p{margin:0;color:#5c716d;font-size:12px}.nx-deal-banner>button{display:flex;align-items:center;gap:9px;border:0;border-radius:5px;padding:12px 15px;background:#123d3a;color:#fff;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap}
.nx-product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.nx-product-card{padding:0;overflow:hidden;text-align:left;border:1px solid #e4e8ed;border-radius:8px;background:#fff;cursor:pointer;min-width:0;transition:box-shadow .2s,transform .2s}.nx-product-card:hover{transform:translateY(-2px);box-shadow:0 10px 25px #14283d12}.nx-product-image{height:220px;position:relative;display:grid;place-items:center;padding:15px;background:#fff;box-sizing:border-box}.nx-product-image img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}.nx-no-image{color:#a0aab5;font-size:14px;font-weight:900;letter-spacing:2px}.nx-stock-badge{position:absolute;left:10px;top:10px;padding:5px 7px;border-radius:3px;background:#e4f7ed;color:#176b47;font-size:9px;font-weight:800}.nx-product-info{display:flex;flex-direction:column;align-items:flex-start;gap:7px;padding:14px;border-top:1px solid #f0f2f4}.nx-product-category{font-size:10px;color:#0f766e}.nx-product-info>strong{min-height:36px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13px;line-height:1.4;color:#273341}.nx-product-price{font-size:19px;font-weight:900;color:#18212f}.nx-product-rating{display:flex;align-items:center;gap:4px;color:#b7791f;font-size:11px}.nx-product-link{display:flex;align-items:center;gap:5px;margin-top:5px;color:#0f766e;font-size:11px;font-weight:800}.nx-product-placeholder{padding:35px 20px;background:#fff;border:1px solid #e4e8ed;border-radius:8px;color:#6b7684;font-size:13px;text-align:center}.nx-product-placeholder a{color:#0f766e}
.nx-deal-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.nx-deal-item{display:flex;gap:12px;min-width:0;padding:12px;text-align:left;border:1px solid #e4e8ed;border-radius:8px;background:#fff;cursor:pointer}.nx-deal-item>div{width:88px;height:100px;display:grid;place-items:center;flex-shrink:0;background:#f7f8fa;border-radius:5px}.nx-deal-item img{max-width:100%;max-height:100%;object-fit:contain}.nx-deal-item-copy{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0}.nx-deal-item-copy small{font-size:9px;color:#0f766e}.nx-deal-item-copy strong{font-size:12px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.nx-deal-item-copy b{font-size:15px}.nx-deal-item-copy em{display:flex;align-items:center;gap:4px;margin-top:auto;color:#0f766e;font-size:10px;font-style:normal;font-weight:800}
.nx-home-footer{margin-top:45px;padding:35px 22px 24px;text-align:center;background:#172a36;color:#fff}.nx-footer-brand{color:#fff;text-decoration:none;font-size:28px;font-weight:900;letter-spacing:-1px}.nx-footer-brand span{color:#65d6bd}.nx-home-footer p{margin:7px 0 20px;color:#bdcbd2;font-size:12px}.nx-home-footer>div{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;margin-bottom:23px}.nx-home-footer>div a{color:#e0e9ed;text-decoration:none;font-size:12px}.nx-home-footer>div a:hover{text-decoration:underline}.nx-home-footer>small{color:#9fb0ba;font-size:10px}
@media(max-width:950px){.nx-hero{grid-template-columns:1fr .7fr}.nx-hero-art{transform:scale(.86)}.nx-department-grid,.nx-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nx-deal-list{grid-template-columns:repeat(2,minmax(0,1fr))}.nx-department-image-wrap{height:190px}}
@media(max-width:620px){.nx-benefits-bar{justify-content:flex-start;gap:12px;padding:10px 14px}.nx-benefits-bar span{font-size:10px}.nx-benefits-bar span:nth-child(n+3){display:none}.nx-hero{margin-top:0;min-height:0;display:block;padding:35px 22px 25px}.nx-hero h1{font-size:40px;letter-spacing:-1.3px}.nx-hero p{font-size:14px}.nx-hero-art{height:205px;margin-top:12px;transform:scale(.8)}.nx-hero-controls{margin-top:23px}.nx-quick-links{grid-template-columns:1fr;padding:12px 14px}.nx-quick-links>div{padding:11px}.nx-section{padding:30px 14px 12px}.nx-section-heading{align-items:flex-start}.nx-section-heading h2{font-size:24px}.nx-section-heading p{font-size:11px;line-height:1.5}.nx-text-link{font-size:10px;margin-top:20px}.nx-department-grid{gap:10px}.nx-department-image-wrap{height:130px}.nx-department-card{padding-bottom:13px}.nx-department-label{margin:11px 10px 5px;font-size:9px}.nx-department-card>strong{margin:0 10px;font-size:12px;padding-right:15px}.nx-department-arrow{right:9px;bottom:13px}.nx-deal-banner{margin:24px 14px 0;padding:18px;gap:11px;flex-wrap:wrap}.nx-deal-icon{width:40px;height:40px}.nx-deal-banner h2{font-size:17px}.nx-deal-banner p{font-size:11px;line-height:1.5}.nx-deal-banner>button{margin-left:51px}.nx-product-grid{gap:10px}.nx-product-image{height:160px;padding:10px}.nx-product-info{padding:11px}.nx-product-info>strong{font-size:12px}.nx-product-price{font-size:17px}.nx-deal-list{grid-template-columns:1fr}.nx-deal-item>div{width:95px}.nx-home-footer{margin-top:32px}.nx-home-footer>div{gap:14px}}
`;

export default Home;
