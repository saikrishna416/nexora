import { useEffect, useMemo, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import {

  Search,

  ChevronDown,

  ChevronRight,

  SlidersHorizontal,

  X,

  Star,

} from "lucide-react";

import api from "../services/api";

const CATEGORY_GROUPS = [

  {

    name: "Men's Fashion",

    keywords: ["men", "mens", "men's", "male"],

    items: [

      "Top Wear", "Shirts", "Casual Shirts", "Formal Shirts", "T-Shirts",

      "Polo T-Shirts", "Sweatshirts", "Hoodies", "Jackets", "Coats",

      "Suits & Blazers", "Ethnic Wear", "Kurtas", "Sherwanis", "Bottom Wear",

      "Jeans", "Casual Trousers", "Formal Trousers", "Track Pants", "Shorts",

      "Innerwear", "Sleepwear", "Men's Shoes", "Casual Shoes", "Formal Shoes",

      "Sneakers", "Sandals & Slippers", "Watches", "Belts", "Wallets",

      "Bags & Backpacks", "Sunglasses", "Accessories",

    ],

  },

  {

    name: "Women's Fashion",

    keywords: ["women", "womens", "women's", "ladies", "female"],

    items: [

      "Tops & T-Shirts", "Shirts", "Kurtis", "Kurtas", "Ethnic Sets",

      "Sarees", "Blouses", "Lehengas", "Salwar Suits", "Dresses",

      "Gowns", "Jumpsuits", "Jeans", "Trousers", "Leggings", "Palazzos",

      "Skirts", "Shorts", "Co-ord Sets", "Sweaters", "Sweatshirts",

      "Jackets & Coats", "Innerwear", "Sleepwear", "Maternity Wear",

      "Women's Shoes", "Heels", "Flats", "Sneakers", "Sandals",

      "Handbags", "Clutches", "Backpacks", "Jewellery", "Watches",

      "Sunglasses", "Belts & Accessories",

    ],

  },

  {

    name: "Kids",

    keywords: ["kid", "kids", "child", "children", "boy", "girl", "baby", "infant"],

    items: [

      "Boys' Clothing", "Girls' Clothing", "Infant Wear",

      "Newborn Clothing", "Baby Rompers", "Baby Sets", "T-Shirts",

      "Shirts", "Tops", "Dresses", "Ethnic Wear", "Jeans & Trousers",

      "Shorts", "Leggings & Jeggings", "Skirts", "Sweaters", "Hoodies",

      "Jackets", "Rainwear", "School Uniforms", "School Shoes",

      "Kids' Sneakers", "Sandals & Slippers", "Booties",

      "Kids' Sports Shoes", "Diapers", "Wipes", "Baby Bath & Skin Care",

      "Baby Feeding", "Baby Bedding", "Baby Carriers", "Strollers",

      "Car Seats", "Toys", "Educational Toys", "Building Blocks", "Dolls",

      "Action Figures", "Remote-Control Toys", "Puzzles & Board Games",

      "Soft Toys", "Outdoor Play", "Cycles & Ride-ons", "School Bags",

      "Lunch Bags & Bottles", "Kids' Watches", "Hair Accessories",

    ],

  },

  {

    name: "Electronics",

    keywords: [

      "electronic", "mobile", "phone", "smartphone", "laptop", "computer",

      "headphone", "earbud", "watch", "camera", "tablet", "printer",

      "monitor", "keyboard", "mouse", "speaker", "power bank", "charger",

    ],

    items: [

      "Mobiles", "Smartphones", "Feature Phones", "Tablets", "Laptops",

      "Desktop Computers", "Monitors", "Computer Accessories", "Keyboards",

      "Mice", "Printers & Scanners", "External Storage", "Pen Drives",

      "Hard Drives & SSDs", "Headphones", "Earphones", "True Wireless Earbuds",

      "Bluetooth Speakers", "Home Audio", "Smart Watches", "Fitness Bands",

      "Cameras", "DSLR & Mirrorless Cameras", "Action Cameras",

      "Camera Lenses & Accessories", "Gaming Consoles", "Gaming Accessories",

      "Routers & Networking", "Power Banks", "Chargers & Cables",

      "Adapters", "Webcams", "Projectors", "Batteries",

    ],

  },

  {

    name: "TVs & Home Entertainment",

    keywords: [

      "tv", "tvs", "television", "oled", "qled", "projector",

      "soundbar", "home theater", "home theatre",

    ],

    items: [

      "LED TVs", "Smart TVs", "Android TVs", "OLED TVs", "QLED TVs",

      "4K Ultra HD TVs", "Full HD TVs", "Large-Screen TVs",

      "TV Stands & Wall Mounts", "TV Cables & Accessories",

      "Streaming Devices", "Set-Top Boxes", "Projectors", "Soundbars",

      "Home Theatre Systems", "Speakers", "AV Receivers",

      "DVD & Blu-ray Players", "Remote Controls",

    ],

  },

  {

    name: "Appliances",

    keywords: [

      "appliance", "refrigerator", "fridge", "washing machine",

      "air conditioner", "cooler", "microwave", "dishwasher", "purifier",

      "geyser", "vacuum", "iron", "fan", "water heater",

    ],

    items: [

      "Refrigerators", "Single Door Refrigerators", "Double Door Refrigerators",

      "Side-by-Side Refrigerators", "French Door Refrigerators",

      "Deep Freezers", "Washing Machines", "Front Load Washing Machines",

      "Top Load Washing Machines", "Semi-Automatic Washing Machines",

      "Washer-Dryer Combos", "Air Conditioners", "Split ACs", "Window ACs",

      "Portable ACs", "Air Coolers", "Air Purifiers", "Water Purifiers",

      "RO Water Purifiers", "Microwave Ovens", "Convection Ovens",

      "Dishwashers", "Geysers & Water Heaters", "Vacuum Cleaners",

      "Robot Vacuum Cleaners", "Irons & Garment Steamers", "Fans",

      "Room Heaters", "Dehumidifiers", "Sewing Machines",

      "Inverters & Batteries", "Voltage Stabilizers",

      "Home Appliance Accessories",

    ],

  },

  {

    name: "Kitchen Appliances",

    keywords: [

      "kitchen", "mixer", "grinder", "juicer", "kettle", "toaster",

      "air fryer", "induction", "rice cooker", "coffee maker", "cookware",

    ],

    items: [

      "Mixer Grinders", "Juicers", "Hand Blenders", "Food Processors",

      "Electric Kettles", "Toasters", "Sandwich Makers", "Air Fryers",

      "Induction Cooktops", "Electric Cooktops", "Rice Cookers",

      "Pressure Cookers", "Electric Pressure Cookers", "Coffee Makers",

      "Espresso Machines", "Milk Frothers", "OTG Ovens", "Hand Mixers",

      "Choppers", "Grills & Griddles", "Bread Makers", "Kitchen Scales",

      "Cookware Sets", "Pots & Pans", "Non-Stick Cookware",

      "Kitchen Tools & Accessories",

    ],

  },

  {

    name: "Home & Living",

    keywords: [

      "home", "living", "furniture", "bedsheet", "bedding", "lighting",

      "decor", "curtain", "mattress", "wardrobe", "sofa",

    ],

    items: [

      "Sofas & Sofa Beds", "Beds & Bed Frames", "Mattresses", "Wardrobes",

      "Cabinets & Drawers", "TV Units", "Study Tables", "Office Furniture",

      "Dining Tables & Chairs", "Coffee Tables", "Bookshelves", "Shoe Racks",

      "Bean Bags", "Outdoor Furniture", "Bedsheets", "Comforters & Quilts",

      "Blankets", "Pillows & Cushions", "Mattress Protectors",

      "Curtains & Blinds", "Carpets & Rugs", "Towels & Bath Linen",

      "Lighting", "Ceiling Lights", "Table Lamps", "Floor Lamps",

      "Wall Lights", "Home Décor", "Wall Art", "Clocks", "Vases & Planters",

      "Mirrors", "Candles & Fragrance", "Storage & Organizers",

      "Laundry Baskets", "Kitchen & Dining", "Dinner Sets", "Crockery",

      "Glassware", "Cutlery", "Water Bottles", "Bathroom Accessories",

      "Doormats", "Cleaning Supplies", "Garden & Outdoor",

      "DIY & Home Improvement",

    ],

  },

  {

    name: "Beauty & Personal Care",

    keywords: [

      "beauty", "skincare", "skin", "makeup", "cosmetic", "hair",

      "fragrance", "perfume", "personal care", "grooming",

    ],

    items: [

      "Skincare", "Face Wash", "Moisturizers", "Serums & Treatments",

      "Sunscreen", "Face Masks", "Lip Care", "Makeup", "Foundation",

      "Concealer", "Face Powder", "Lipstick & Lip Gloss", "Eye Makeup",

      "Makeup Brushes & Tools", "Makeup Removers", "Hair Care",

      "Shampoo", "Conditioner", "Hair Oils", "Hair Styling",

      "Hair Dryers & Straighteners", "Hair Colour", "Fragrances",

      "Perfumes", "Deodorants", "Bath & Body", "Body Wash",

      "Body Lotions", "Oral Care", "Electric Toothbrushes",

      "Men's Grooming", "Shaving & Hair Removal", "Trimmers",

      "Epilators", "Nail Care", "Beauty Appliances",

    ],

  },

  {

    name: "Sports & Fitness",

    keywords: [

      "sport", "sports", "fitness", "gym", "cycling", "outdoor",

      "yoga", "exercise", "camping",

    ],

    items: [

      "Fitness Equipment", "Dumbbells & Weights", "Resistance Bands",

      "Treadmills", "Exercise Bikes", "Yoga Mats", "Yoga Accessories",

      "Sports Shoes", "Running Shoes", "Cricket", "Football", "Badminton",

      "Tennis", "Basketball", "Table Tennis", "Swimming", "Cycling",

      "Bicycles", "Helmets & Safety Gear", "Camping & Hiking",

      "Trekking Gear", "Outdoor Gear", "Fishing Gear", "Sports Clothing",

      "Tracksuits", "Gym Gloves & Belts", "Sports Bags", "Water Bottles",

      "Fitness Trackers", "Recovery & Massage",

    ],

  },

  {

    name: "Books & Stationery",

    keywords: [

      "book", "books", "stationery", "pen", "notebook",

      "office supplies", "art supplies",

    ],

    items: [

      "Fiction Books", "Non-Fiction Books", "Educational Books",

      "Children's Books", "Competitive Exam Books",

      "Comics & Graphic Novels", "Notebooks & Diaries", "Pens & Pencils",

      "Art Supplies", "School Supplies", "Office Supplies",

      "Printers & Paper",

    ],

  },

];

const normalize = (value = "") =>

  String(value)

    .toLowerCase()

    .replace(/&/g, "and")

    .replace(/[^a-z0-9]+/g, " ")

    .trim();

function getCategoryGroup(categoryName = "", productName = "") {

  const category = normalize(categoryName);

  const name = normalize(productName);

  const combined = `${category} ${name}`;

  // Explicit gendered category labels always win, so Men's/Women's products

  // cannot be routed to the opposite department by generic product keywords.

  if (/\b(women|womens|ladies|female|womenswear)\b/.test(category)) return "Women's Fashion";

  if (/\b(men|mens|male|menswear)\b/.test(category)) {

    if (/\b(grooming|beauty|skin|hair|perfume)\b/.test(category)) return "Beauty & Personal Care";

    return "Men's Fashion";

  }

  if (/\b(women|womens|ladies|female)\b/.test(name)) return "Women's Fashion";

  if (/\b(men|mens|male)\b/.test(name) && !/\b(women|womens)\b/.test(name)) return "Men's Fashion";

  if (/\b(kid|kids|children|child|baby|infant|boys|girls)\b/.test(combined)) return "Kids";

  if (/\b(tv|tvs|television|oled|qled|projector|soundbar|home theater|home theatre)\b/.test(combined)) return "TVs & Home Entertainment";

  if (/\b(kitchen|mixer|grinder|juicer|kettle|toaster|air fryer|induction|rice cooker|coffee maker|cookware)\b/.test(category)) return "Kitchen Appliances";

  if (/\b(refrigerator|fridge|washing machine|air conditioner|split ac|window ac|cooler|microwave|dishwasher|purifier|geyser|vacuum|iron|fan|appliance|water heater)\b/.test(combined)) return "Appliances";

  if (/\b(electronic|mobile|mobiles|phone|smartphone|laptop|computer|headphone|earphone|earbud|watch|camera|tablet|printer|monitor|keyboard|mouse|speaker|charger|power bank|gaming|router)\b/.test(combined)) return "Electronics";

  if (/\b(beauty|skincare|skin care|makeup|cosmetic|hair care|fragrance|perfume|grooming|oral care)\b/.test(category)) return "Beauty & Personal Care";

  if (/\b(sport|sports|fitness|gym|cycling|outdoor|yoga|cricket|football|badminton|tennis|camping|hiking)\b/.test(combined)) return "Sports & Fitness";

  if (/\b(book|books|stationery|notebook|office supplies|art supplies)\b/.test(combined)) return "Books & Stationery";

  if (/\b(home|living|furniture|bedsheet|bedding|lighting|decor|decoration|curtain|mattress|wardrobe|sofa|dining|bathroom|storage)\b/.test(combined)) return "Home & Living";

  return "Other";

}

function itemMatchesProduct(item, product) {

  const itemText = normalize(item);

  const category = normalize(product.category_name || "");

  const name = normalize(product.name || "");

  const combined = `${category} ${name}`;

  if (

    category === itemText ||

    normalize(product.category_name || "") === itemText

  ) {

    return true;

  }

  const aliases = {

    "top wear": ["top wear", "shirt", "t shirt", "tshirt", "polo", "hoodie", "sweatshirt", "top"],

    "bottom wear": ["bottom wear", "jeans", "trouser", "pants", "shorts", "leggings"],

    "boys clothing": ["boys", "boy"],

    "girls clothing": ["girls", "girl"],

    "infant wear": ["infant", "newborn", "baby"],

    "kids shoes": ["kids shoes", "children shoes", "baby shoes"],

    "mobiles": ["mobile", "smartphone", "phone"],

    "laptops": ["laptop", "notebook computer"],

    "headphones": ["headphone", "earphone", "earbud"],

    "smart watches": ["smart watch", "smartwatch", "fitness band"],

    "tvs": ["tv", "television", "oled", "qled"],

    "led tvs": ["led tv", "television"],

    "smart tvs": ["smart tv", "android tv"],

    "air conditioners": ["air conditioner", "split ac", "window ac"],

    "split acs": ["split ac", "split air conditioner"],

    "window acs": ["window ac", "window air conditioner"],

    "refrigerators": ["refrigerator", "fridge"],

    "washing machines": ["washing machine", "washer"],

    "microwave ovens": ["microwave", "oven"],

    "kitchen appliances": ["mixer", "grinder", "juicer", "kettle", "toaster", "air fryer", "induction", "rice cooker", "coffee maker", "cookware"],

    "skincare": ["skin care", "skincare", "moisturizer", "sunscreen", "face wash"],

    "makeup": ["makeup", "cosmetic", "lipstick", "foundation"],

    "fragrances": ["fragrance", "perfume", "deodorant"],

    "furniture": ["furniture", "sofa", "wardrobe", "table", "chair", "bed"],

    "bedsheets": ["bedsheet", "bed sheet", "bedding"],

    "lighting": ["lighting", "lamp", "light"],

    "home décor": ["decor", "decoration", "wall art"],

    "fitness equipment": ["fitness", "gym", "dumbbell", "treadmill", "exercise bike"],

    "sports shoes": ["sports shoes", "running shoes", "training shoes"],

    "toys": ["toy", "puzzle", "doll", "action figure", "building block"],

    "books": ["book", "novel", "comic"],

    "stationery": ["stationery", "notebook", "pen", "pencil"],

  };

  const terms = aliases[itemText] || [item];

  return terms.some((term) => combined.includes(normalize(term)));

}

function Products() {

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);

  // The URL is the single source of truth for active filters.
  const selectedCategory = searchParams.get("category") || "all";
  const selectedSubcategory = searchParams.get("subcategory") || "";
  const searchTerm = searchParams.get("search") || "";

  

  const [showSuggestions, setShowSuggestions] = useState(false);

  const [expandedCategory, setExpandedCategory] = useState(

    searchParams.get("category") || ""

  );

  const [showMobileFilters, setShowMobileFilters] = useState(false);

const [showCategories, setShowCategories] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {

    let active = true;

    api.get("/products/?page_size=100")

      .then((response) => {

        const data = response.data.results || response.data;

        if (active) setProducts(Array.isArray(data) ? data : []);

      })

      .catch((err) => {

        console.error("Failed to load products:", err);

        if (active) setError("Failed to load products. Please try again.");

      })

      .finally(() => {

        if (active) setLoading(false);

      });

    return () => {

      active = false;

    };

  }, []);

  const availableCategories = useMemo(

    () => [

      ...new Set(

        products.map((product) => product.category_name?.trim()).filter(Boolean)

      ),

    ].sort((a, b) => a.localeCompare(b)),

    [products]

  );

  const categoryGroups = useMemo(() => {

    const groups = CATEGORY_GROUPS.map((group) => ({

      ...group,

      actualCategories: availableCategories.filter(

        (category) => getCategoryGroup(category) === group.name

      ),

    }));

    const otherCategories = availableCategories.filter(

      (category) => getCategoryGroup(category) === "Other"

    );

    if (otherCategories.length) {

      groups.push({

        name: "Other Categories",

        keywords: [],

        items: otherCategories,

        actualCategories: otherCategories,

      });

    }

    return groups;

  }, [availableCategories]);

  const suggestions = useMemo(() => {

    const term = normalize(searchTerm);

    if (!term) return [];

    return products

      .filter((product) =>

        normalize(`${product.name} ${product.category_name || ""}`).includes(term)

      )

      .slice(0, 6);

  }, [products, searchTerm]);

  const updateUrl = (category, subcategory, search) => {

    const params = new URLSearchParams(searchParams);

    if (category && category !== "all") params.set("category", category);

    else params.delete("category");

    if (subcategory) params.set("subcategory", subcategory);

    else params.delete("subcategory");

    if (search) params.set("search", search);

    else params.delete("search");

    setSearchParams(params, { replace: true });

  };

  const handleSearch = (event) => {

    event?.preventDefault();

    setShowSuggestions(false);

    updateUrl(selectedCategory, selectedSubcategory, searchTerm.trim());

  };

  const selectCategory = (category) => {

    setExpandedCategory(category === "all" ? "" : category);

    setShowMobileFilters(false);

    updateUrl(category, "", searchTerm.trim());

  };

  const selectSubcategory = (groupName, item) => {

    setExpandedCategory(groupName);

    setShowMobileFilters(false);

    updateUrl(groupName, item, searchTerm.trim());

  };

const filteredProducts = useMemo(() => {

  const term = normalize(searchTerm);

  return products.filter((product) => {

    const productCategory = (

      product.category_name || ""

    ).trim();

    const groupName = getCategoryGroup(

      productCategory,

      product.name || ""

    );

    const searchable = normalize(

      `${product.name || ""} ${productCategory}`

    );

    const matchesSearch =

      !term || searchable.includes(term);

    const matchesCategory =

      selectedCategory === "all" ||

      groupName === selectedCategory ||

      normalize(productCategory) ===

        normalize(selectedCategory);

    const matchesSubcategory =

      !selectedSubcategory ||

      itemMatchesProduct(selectedSubcategory, product);

    return (

      matchesSearch &&

      matchesCategory &&

      matchesSubcategory

    );

  });

}, [

  products,

  searchTerm,

  selectedCategory,

  selectedSubcategory,

]);

  const activeTitle = selectedSubcategory ||

    (selectedCategory === "all" ? "All Products" : selectedCategory);

  const clearFilters = () => {

    setExpandedCategory("");

    setShowSuggestions(false);

    setSearchParams({}, { replace: true });

  };

  if (loading) {

    return (

      <main className="nex-products-page">

        <p className="nex-products-status">Loading products...</p>

        <style>{productsStyles}</style>

      </main>

    );

  }

  if (error) {

    return (

      <main className="nex-products-page">

        <p className="nex-products-status nex-products-error">{error}</p>

        <style>{productsStyles}</style>

      </main>

    );

  }

  return (

    <main className="nex-products-page">

      <style>{productsStyles}</style>

      <div className="nex-products-container">

        <header className="nex-products-heading">

          <div>

            <span className="nex-products-eyebrow">THE NEXORA COLLECTION</span>

            <h1>Find your next favorite.</h1>

            <p>Shop smarter. Live better.</p>

          </div>

          <div className="nex-products-count">

            {filteredProducts.length} products

          </div>

        </header>

        <div className="nex-products-search-wrap">

          <form className="nex-products-search" onSubmit={handleSearch}>

            <Search size={20} />

            <input

              type="search"

              placeholder="Search products, categories..."

              value={searchTerm}

              onFocus={() => setShowSuggestions(true)}

              onChange={(event) => {

                updateUrl(selectedCategory, selectedSubcategory, event.target.value);

                setShowSuggestions(true);

              }}

              onKeyDown={(event) => {

                if (event.key === "Escape") setShowSuggestions(false);

              }}

              aria-label="Search products"

            />

            {searchTerm && (

              <button

                type="button"

                className="nex-products-clear"

                aria-label="Clear search"

                onClick={() => {

                  setShowSuggestions(false);

                  updateUrl(selectedCategory, selectedSubcategory, "");

                }}

              >

                <X size={17} />

              </button>

            )}

            <button type="submit" className="nex-products-search-button">

              Search

            </button>

          </form>

          {showSuggestions && searchTerm.trim() && (

            <div className="nex-products-suggestions">

              {suggestions.length ? (

                suggestions.map((product) => (

                  <button

                    key={product.id}

                    type="button"

                    onClick={() => {

                      setShowSuggestions(false);

                      navigate(`/products/${product.id}`);

                    }}

                  >

                    <span>{product.name}</span>

                    <span className="nex-suggestion-price">

                      ₹{product.price}

                    </span>

                  </button>

                ))

              ) : (

                <p>No matching products found.</p>

              )}

              <button

                type="button"

                className="nex-suggestion-all"

                onClick={handleSearch}

              >

                See all search results <ChevronRight size={16} />

              </button>

            </div>

          )}

        </div>

        <div className="nex-products-mobile-toolbar">

          <button

            type="button"

            onClick={() => setShowMobileFilters(!showMobileFilters)}

          >

            <SlidersHorizontal size={17} />

            Categories

            <ChevronDown size={16} />

          </button>

          <span>{activeTitle}</span>

        </div>

<div className="nex-category-toolbar">

  <button

    type="button"

    className="nex-categories-toggle"

    onClick={() => setShowCategories((visible) => !visible)}

    aria-expanded={showCategories}

    aria-controls="nex-products-sidebar"

  >

    <SlidersHorizontal size={17} />

    {showCategories ? "Hide Categories" : "Show Categories"}

    <ChevronDown

      size={16}

      className={showCategories ? "nex-toggle-open" : ""}

    />

  </button>

</div>

        <div

          className={`nex-products-layout ${

            showCategories ? "" : "nex-categories-hidden"

          }`}

        >

          <aside

            id="nex-products-sidebar"

            className={`nex-products-sidebar ${

              showMobileFilters ? "nex-sidebar-open" : ""

            }`}

          >

            <div className="nex-sidebar-heading">

              <h2>Categories</h2>

              <button

                type="button"

                aria-label="Close categories"

                className="nex-sidebar-close"

                onClick={() => setShowMobileFilters(false)}

              >

                <X size={18} />

              </button>

            </div>

            <button

              type="button"

              className={`nex-category-all ${

                selectedCategory === "all" ? "is-active" : ""

              }`}

              onClick={() => selectCategory("all")}

            >

              All Products

            </button>

            {categoryGroups.map((group) => (

              <div className="nex-category-group" key={group.name}>

                <button

                  type="button"

                  className={`nex-category-parent ${

                    selectedCategory === group.name ? "is-active" : ""

                  }`}

                  onClick={() => {

                    const willExpand = expandedCategory !== group.name;

                    setExpandedCategory(willExpand ? group.name : "");

                    if (selectedCategory !== group.name) {

                      updateUrl(group.name, "", searchTerm.trim());

                    }

                  }}

                >

                  <span>{group.name}</span>

                  {expandedCategory === group.name ? (

                    <ChevronDown size={16} />

                  ) : (

                    <ChevronRight size={16} />

                  )}

                </button>

                {expandedCategory === group.name && (

                  <div className="nex-category-children">

                    {group.items.map((item) => (

                      <button

                        type="button"

                        key={item}

                        className={`nex-category-child ${

                          normalize(selectedSubcategory) === normalize(item)

                            ? "is-active"

                            : ""

                        }`}

                        onClick={() => selectSubcategory(group.name, item)}

                      >

                        {item}

                      </button>

                    ))}

                  </div>

                )}

              </div>

            ))}

          </aside>

          <section className="nex-products-results">

            <div className="nex-results-heading">

              <div>

                <h2>{activeTitle}</h2>

                <p>

                  Showing {filteredProducts.length}{" "}

                  {filteredProducts.length === 1 ? "product" : "products"}

                </p>

              </div>

              {(selectedCategory !== "all" ||

                selectedSubcategory ||

                searchTerm) && (

                <button

                  type="button"

                  className="nex-reset-filters"

                  onClick={clearFilters}

                >

                  Clear filters <X size={15} />

                </button>

              )}

            </div>

            {filteredProducts.length === 0 ? (

              <div className="nex-products-empty">

                <Search size={34} />

                <h3>No products found</h3>

                <p>

                  This category may not have products in the catalogue yet.

                  Try another category or view all products.

                </p>

                <button type="button" onClick={clearFilters}>

                  View all products

                </button>

              </div>

            ) : (

              <div className="nex-products-grid">

                {filteredProducts.map((product) => (

                  <article className="nex-product-card" key={product.id}>

                    <button

                      type="button"

                      className="nex-product-image"

                      onClick={() => navigate(`/products/${product.id}`)}

                      aria-label={`View ${product.name} details`}

                    >

                      {product.image ? (

                        <img src={product.image} alt={product.name} />

                      ) : (

                        <span className="nex-product-no-image">

                          No image available

                        </span>

                      )}

                      {product.review_count > 0 &&

                        product.average_rating != null && (

                          <span className="nex-product-rating">

                            {Number(product.average_rating).toFixed(1)}

                            <Star size={12} fill="currentColor" />

                            <span>({product.review_count})</span>

                          </span>

                        )}

                    </button>

                    <div className="nex-product-info">

                      <p className="nex-product-category">

                        {product.category_name || "Nexora"}

                      </p>

                      <button

                        type="button"

                        className="nex-product-name"

                        onClick={() => navigate(`/products/${product.id}`)}

                      >

                        {product.name}

                      </button>

                      <p className="nex-product-price">₹{product.price}</p>

                      <p

                        className={`nex-product-stock ${

                          product.stock > 0 ? "in-stock" : "out-stock"

                        }`}

                      >

                        {product.stock > 0

                          ? "In stock"

                          : "Currently unavailable"}

                      </p>

                      <button

                        type="button"

                        className="nex-product-details-button"

                        onClick={() => navigate(`/products/${product.id}`)}

                      >

                        View details <ChevronRight size={16} />

                      </button>

                    </div>

                  </article>

                ))}

              </div>

            )}

          </section>

        </div>

      </div>

    </main>

  );

}

const productsStyles = `

  .nex-products-page {

    min-height: 70vh;

    padding: 35px 20px 60px;

    background: #f8fafc;

    color: #111827;

    font-family: Arial, Helvetica, sans-serif;

  }

  .nex-products-container {

    max-width: 1440px;

    margin: 0 auto;

  }

  .nex-products-heading {

    display: flex;

    justify-content: space-between;

    align-items: flex-end;

    gap: 20px;

    margin-bottom: 25px;

  }

  .nex-products-eyebrow {

    color: #0f766e;

    font-size: 11px;

    letter-spacing: 1.5px;

    font-weight: 600;

  }

  .nex-products-heading h1 {

    margin: 9px 0;

    font-size: clamp(25px, 3vw, 34px);

    font-weight: 400;

    letter-spacing: -0.4px;

  }

  .nex-products-heading p {

    margin: 0;

    color: #6b7280;

    font-size: 14px;

  }

  .nex-products-count {

    padding: 9px 13px;

    border: 1px solid #ccfbf1;

    border-radius: 9px;

    background: #f0fdfa;

    color: #0f766e;

    font-size: 13px;

    white-space: nowrap;

  }

  .nex-products-search-wrap {

    position: relative;

    z-index: 5;

    max-width: 700px;

    margin: 0 auto 28px;

  }

  .nex-products-search {

    display: flex;

    align-items: center;

    gap: 10px;

    padding: 5px 6px 5px 15px;

    border: 1px solid #d1d5db;

    border-radius: 12px;

    background: white;

    color: #6b7280;

    box-shadow: 0 4px 15px rgba(15, 23, 42, 0.04);

  }

  .nex-products-search:focus-within {

    border-color: #5eead4;

    box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.15);

  }

  .nex-products-search input {

    flex: 1;

    width: 0;

    min-width: 0;

    padding: 11px 0;

    border: none;

    outline: none;

    background: transparent;

    color: #111827;

    font-size: 14px;

  }

  .nex-products-search-button {

    padding: 11px 19px;

    border: none;

    border-radius: 8px;

    background: #111827;

    color: white;

    font-size: 13px;

    cursor: pointer;

  }

  .nex-products-clear {

    display: grid;

    place-items: center;

    border: none;

    background: transparent;

    color: #6b7280;

    cursor: pointer;

  }

  .nex-products-suggestions {

    position: absolute;

    top: calc(100% + 6px);

    left: 0;

    right: 0;

    overflow: hidden;

    border: 1px solid #e5e7eb;

    border-radius: 12px;

    background: white;

    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);

  }

  .nex-products-suggestions button {

    display: flex;

    justify-content: space-between;

    align-items: center;

    gap: 12px;

    width: 100%;

    padding: 13px 16px;

    border: none;

    border-bottom: 1px solid #f1f5f9;

    background: white;

    color: #111827;

    text-align: left;

    cursor: pointer;

  }

  .nex-products-suggestions button:hover {

    background: #f0fdfa;

  }

  .nex-products-suggestions p {

    padding: 12px 16px;

    color: #6b7280;

    font-size: 13px;

  }

  .nex-products-suggestions .nex-suggestion-price {

    color: #0f766e;

    white-space: nowrap;

  }

  .nex-products-suggestions .nex-suggestion-all {

    justify-content: flex-start;

    color: #0f766e;

    font-weight: 600;

  }

  .nex-products-layout {

    display: grid;

    grid-template-columns: 250px minmax(0, 1fr);

    align-items: start;

    gap: 26px;

  }

  .nex-products-sidebar {

    position: sticky;

    top: 18px;

    max-height: calc(100vh - 36px);

    overflow-y: auto;

    border: 1px solid #e5e7eb;

    border-radius: 14px;

    background: white;

  }

  .nex-sidebar-heading {

    position: sticky;

    top: 0;

    z-index: 1;

    display: flex;

    align-items: center;

    justify-content: space-between;

    padding: 18px 17px 12px;

    background: white;

  }

  .nex-sidebar-heading h2 {

    margin: 0;

    font-size: 16px;

    font-weight: 600;

  }

  .nex-sidebar-close {

    display: none;

  }

  .nex-category-all,

  .nex-category-parent,

  .nex-category-child {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 10px;

    width: 100%;

    border: none;

    text-align: left;

    cursor: pointer;

    font-family: inherit;

  }

  .nex-category-all {

    padding: 13px 17px;

    background: white;

    color: #374151;

    font-size: 13px;

    font-weight: 600;

  }

  .nex-category-parent {

    padding: 13px 17px;

    border-top: 1px solid #f1f5f9;

    background: white;

    color: #374151;

    font-size: 13px;

  }

  .nex-category-all:hover,

  .nex-category-parent:hover {

    background: #f8fafc;

  }

  .nex-category-all.is-active,

  .nex-category-parent.is-active {

    background: #f0fdfa;

    color: #0f766e;

  }

  .nex-category-children {

    padding: 3px 8px 10px 20px;

    background: #fbfefd;

  }

  .nex-category-child {

    justify-content: flex-start;

    padding: 9px 10px;

    border-radius: 7px;

    background: transparent;

    color: #6b7280;

    font-size: 12px;

    line-height: 1.35;

  }

  .nex-category-child:hover,

  .nex-category-child.is-active {

    background: #ccfbf1;

    color: #115e59;

  }

  .nex-products-results {

    min-width: 0;

  }

  .nex-results-heading {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 12px;

    margin-bottom: 17px;

  }

  .nex-results-heading h2 {

    margin: 0 0 5px;

    font-size: 20px;

    font-weight: 400;

  }

  .nex-results-heading p {

    margin: 0;

    color: #6b7280;

    font-size: 12px;

  }

  .nex-reset-filters {

    display: inline-flex;

    align-items: center;

    gap: 5px;

    padding: 8px 10px;

    border: 1px solid #d1d5db;

    border-radius: 8px;

    background: white;

    color: #374151;

    font-size: 12px;

    cursor: pointer;

    white-space: nowrap;

  }

  .nex-products-grid {

    display: grid;

    grid-template-columns: repeat(3, minmax(0, 1fr));

    gap: 20px;

  }

  .nex-products-layout.nex-categories-hidden .nex-products-grid {

    grid-template-columns: repeat(4, minmax(0, 1fr));

  }

  /* Compact, scan-friendly subcategory menu inspired by a mega-menu. */

  .nex-category-children {

    display: grid;

    grid-template-columns: repeat(2, minmax(0, 1fr));

    gap: 3px 6px;

    padding: 8px 10px 12px 14px;

    background: #f8fafc;

  }

  .nex-category-child {

    min-width: 0;

    padding: 8px 9px;

    border-radius: 6px;

    overflow-wrap: anywhere;

  }

  .nex-product-card {

    display: flex;

    min-width: 0;

    min-height: 640px;

    flex-direction: column;

    overflow: hidden;

    border: 1px solid #e5e7eb;

    border-radius: 13px;

    background: white;

    transition: box-shadow 0.2s, transform 0.2s;

  }

  .nex-product-card:hover {

    transform: translateY(-2px);

    box-shadow: 0 9px 24px rgba(15, 23, 42, 0.08);

  }

  .nex-product-image {

    position: relative;

    display: flex;

    flex-shrink: 0;

    align-items: center;

    justify-content: center;

    width: 100%;

    height: 420px;

    padding: 12px;

    box-sizing: border-box;

    overflow: hidden;

    border: none;

    background: #ffffff;

    cursor: pointer;

  }

/* Keep the complete source image visible; never crop to fill the card. */

  .nex-product-image img {

    display: block;

    width: auto;

    height: auto;

    max-width: 100%;

    max-height: 100%;

    object-fit: contain;

    object-position: center;

    padding: 0;

    margin: auto;

    transform: none;

    transition: none;

  }

  .nex-product-card:hover .nex-product-image img {

    transform: none;

  }

  .nex-product-no-image {

    color: #9ca3af;

    font-size: 12px;

  }

  .nex-product-rating {

    position: absolute;

    bottom: 10px;

    left: 10px;

    display: inline-flex;

    align-items: center;

    gap: 4px;

    padding: 5px 7px;

    border-radius: 6px;

    background: #0f766e;

    color: white;

    font-size: 11px;

  }

  .nex-product-rating span {

    opacity: 0.85;

  }

  .nex-product-info {

    display: flex;

    flex: 1;

    flex-direction: column;

    padding: 19px;

  }

  .nex-product-category {

    margin: 0 0 7px;

    color: #0f766e;

    font-size: 11px;

  }

  .nex-product-name {

    display: -webkit-box;

    overflow: hidden;

    min-height: 44px;

    padding: 0;

    border: none;

    background: transparent;

    color: #111827;

    font-size: 15px;

    line-height: 1.45;

    text-align: left;

    cursor: pointer;

    font-family: inherit;

    -webkit-box-orient: vertical;

    -webkit-line-clamp: 2;

  }

  .nex-product-name:hover {

    color: #0f766e;

  }

  .nex-product-price {

    margin: 13px 0 7px;

    color: #111827;

    font-size: 22px;

  }

  .nex-product-stock {

    margin: 0 0 15px;

    font-size: 12px;

  }

  .nex-product-stock.in-stock {

    color: #15803d;

  }

  .nex-product-stock.out-stock {

    color: #dc2626;

  }

  .nex-product-details-button {

    display: flex;

    align-items: center;

    justify-content: center;

    gap: 6px;

    width: 100%;

    margin-top: auto;

    padding: 11px 8px;

    border: 1px solid #99f6e4;

    border-radius: 8px;

    background: #f0fdfa;

    color: #0f766e;

    font-size: 13px;

    cursor: pointer;

  }

  .nex-product-details-button:hover {

    background: #ccfbf1;

  }

  .nex-products-mobile-toolbar {

    display: none;

  }

  .nex-products-empty,

  .nex-products-status {

    padding: 60px 20px;

    color: #6b7280;

    text-align: center;

  }

  .nex-products-empty {

    display: flex;

    flex-direction: column;

    align-items: center;

    border: 1px dashed #d1d5db;

    border-radius: 14px;

    background: white;

  }

  .nex-products-empty h3 {

    margin: 15px 0 5px;

    color: #111827;

    font-weight: 500;

  }

  .nex-products-empty p {

    max-width: 420px;

    font-size: 13px;

    line-height: 1.6;

  }

  .nex-products-empty button {

    margin-top: 10px;

    padding: 11px 16px;

    border: none;

    border-radius: 8px;

    background: #111827;

    color: white;

    cursor: pointer;

  }

  .nex-products-error {

    color: #dc2626;

  }

  .nex-category-toolbar {

    display: flex;

    justify-content: flex-start;

    margin-bottom: 12px;

  }

  .nex-categories-toggle {

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 8px;

    padding: 10px 14px;

    border: 1px solid #d1d5db;

    border-radius: 9px;

    background: white;

    color: #111827;

    font-size: 13px;

    font-weight: 600;

    cursor: pointer;

  }

  .nex-categories-toggle:hover {

    background: #f0fdfa;

    border-color: #5eead4;

  }

  .nex-toggle-open {

    transform: rotate(180deg);

  }

  .nex-products-layout.nex-categories-hidden {

    grid-template-columns: minmax(0, 1fr);

  }

  .nex-products-layout.nex-categories-hidden .nex-products-sidebar {

    display: none;

  }

  @media (max-width: 1200px) {

    .nex-products-layout {

      grid-template-columns: 220px minmax(0, 1fr);

      gap: 18px;

    }

    .nex-products-grid,

    .nex-products-layout.nex-categories-hidden .nex-products-grid {

      grid-template-columns: repeat(2, minmax(0, 1fr));

    }

    .nex-product-card {

      min-height: 590px;

    }

    .nex-product-image {

      height: 360px;

    }

  }

  @media (max-width: 700px) {

    .nex-products-page {

      padding: 25px 14px 40px;

    }

    .nex-products-heading {

      align-items: flex-start;

    }

    .nex-products-heading h1 {

      font-size: 26px;

    }

    .nex-products-count {

      padding: 7px 9px;

      font-size: 11px;

    }

    .nex-products-layout {

      display: block;

    }

    .nex-category-toolbar {

      display: none;

    }

    .nex-products-mobile-toolbar {

      display: flex;

      align-items: center;

      justify-content: space-between;

      gap: 10px;

      margin-bottom: 17px;

    }

    .nex-products-mobile-toolbar button {

      display: inline-flex;

      align-items: center;

      gap: 7px;

      padding: 10px 12px;

      border: 1px solid #d1d5db;

      border-radius: 9px;

      background: white;

      color: #111827;

      font-size: 12px;

      cursor: pointer;

    }

    .nex-products-mobile-toolbar > span {

      overflow: hidden;

      color: #0f766e;

      font-size: 12px;

      text-overflow: ellipsis;

      white-space: nowrap;

    }

    .nex-products-sidebar {

      display: none;

      position: static;

      max-height: 65vh;

      margin-bottom: 20px;

    }

    .nex-products-sidebar.nex-sidebar-open {

      display: block;

    }

    .nex-sidebar-heading {

      display: flex;

      align-items: center;

      justify-content: space-between;

    }

    .nex-sidebar-close {

      display: grid;

      place-items: center;

      padding: 6px;

      border: none;

      border-radius: 6px;

      background: #f3f4f6;

      cursor: pointer;

    }

    .nex-products-grid {

      grid-template-columns: repeat(2, minmax(0, 1fr));

      gap: 12px;

    }

    .nex-product-card {

      min-height: 500px;

    }

    .nex-product-image {

      height: 280px;

    }

    .nex-product-info {

      padding: 12px;

    }

    .nex-product-name {

      min-height: 38px;

      font-size: 13px;

    }

    .nex-product-price {

      font-size: 18px;

    }

    .nex-product-stock {

      font-size: 11px;

    }

    .nex-product-rating {

      left: 7px;

      bottom: 7px;

      font-size: 10px;

    }

    .nex-product-details-button {

      font-size: 12px;

    }

  }

  @media (max-width: 400px) {

    .nex-products-page {

      padding-right: 10px;

      padding-left: 10px;

    }

    .nex-products-search {

      gap: 6px;

      padding-left: 9px;

    }

    .nex-products-search-button {

      padding: 10px;

    }

    .nex-products-grid {

      gap: 8px;

    }

    .nex-product-card {

      min-height: 450px;

    }

    .nex-product-image {

      height: 235px;

    }

    .nex-product-info {

      padding: 9px;

    }

    .nex-product-price {

      font-size: 16px;

    }

    .nex-product-details-button {

      padding: 9px 5px;

    }

  }

`;

export default Products;
