import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { ChevronRight, Star } from "lucide-react";

import api from "../services/api";



// Safely read a product category regardless of the API response shape.

function getProductCategory(product) {
  const category = product?.category;

  const values = [
    typeof category === "string" ? category : "",
    category?.name,
    category?.title,
    category?.slug,
    category?.parent?.name,
    category?.parent?.title,
    category?.parent?.slug,
    product?.category_name,
    product?.category_title,
    product?.category_slug,
    product?.category_path,
    product?.parent_category_name,
    product?.parent_category?.name,
    product?.parent_category?.title,
    product?.parent_category?.slug,
    product?.subcategory,
    product?.subcategory_name,
    product?.gender,
  ];

  return values
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();
}

function Products() {

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const selectedCategory = searchParams.get("category") || "";

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  useEffect(() => {

    let active = true;



    api

      .get("/products/?page_size=100")

      .then((response) => {

        const data = response?.data?.results ?? response?.data;

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



  const normalize = (value) => String(value || "")

    .toLowerCase()

    .replace(/[’']/g, "")

    .replace(/&/g, "and")

    .replace(/[^a-z0-9]+/g, " ")

    .trim();



  // Use category metadata as the source of truth. Product descriptions are

  // intentionally NOT used to decide the category (e.g. a gaming mouse must

  // not appear in Sports just because it is used for gaming).

  const getCategoryPath = (product) => {

    const category = product.category;

    const values = [];



    if (typeof category === "string") values.push(category);

    if (category && typeof category === "object") {

      values.push(

        category.name,

        category.title,

        category.slug,

        category.parent?.name,

        category.parent?.title,

        category.parent?.slug,

      );

    }



    values.push(

      product.category_name,

      product.category_title,

      product.category_slug,

      product.category_path,

      product.parent_category_name,

      product.parent_category?.name,

      product.parent_category?.title,

      product.parent_category?.slug,

    );



    return values.filter(Boolean).map(normalize).filter(Boolean);

  };



  const hasAny = (values, terms) => values.some((value) =>

    terms.some((term) => value === normalize(term) || value.includes(normalize(term)))

  );



  const filteredProducts = !selectedCategory

    ? products

    : products.filter((product) => {

        const categories = getCategoryPath(product);

        const selected = normalize(selectedCategory);

        const name = normalize(product.name || product.title || product.product_name || product.productName || "");



        // A specific category must be present in the product's category metadata.

        if (selected === "mobiles" || selected === "mobile") {

          const explicitlyMobile = hasAny(categories, ["mobiles", "mobile phones", "mobile", "smartphones", "smart phones", "cell phones"]);

          const broadElectronics = hasAny(categories, ["electronics", "electronic"]);

          const titleLooksMobile = hasAny([name], ["iphone", "smartphone", "mobile phone", "android phone", "cell phone", "feature phone"]);

          const titleLooksComputer = hasAny([name], ["laptop", "notebook", "chromebook", "desktop", "monitor", "tablet", "ipad", "keyboard", "mouse", "headphone", "earphone", "speaker"]);

          return explicitlyMobile || (broadElectronics && titleLooksMobile && !titleLooksComputer);

        }



        if (selected === "tvs appliances" || selected === "tv appliances" || selected.includes("appliance")) {

          return hasAny(categories, ["tvs and appliances", "tv and appliances", "televisions", "tv", "home appliances", "appliances"]);

        }



        if (selected === "beauty" || selected.includes("beauty")) {

          return hasAny(categories, ["beauty", "beauty and personal care", "personal care", "cosmetics", "skincare", "skin care", "hair care"]);

        }



        if (selected === "sports" || selected.includes("sport") || selected.includes("fitness")) {

          return hasAny(categories, ["sports", "sports and fitness", "sport and fitness", "fitness", "sports equipment", "sportswear"]);

        }



     
if (selected.includes("women") && selected.includes("fashion")) {
  const gender = normalize(
    product.gender ||
    product.target_gender ||
    product.for_gender ||
    product.audience ||
    product.department ||
    (typeof product.subcategory === "string"
      ? product.subcategory
      : product.subcategory?.name) ||
    (typeof product.sub_category === "string"
      ? product.sub_category
      : product.sub_category?.name) ||
    ""
  );

  const womenCategory = hasAny(categories, [
    "womens fashion",
    "women fashion",
    "womens clothing",
    "women clothing",
    "womenswear",
    "women apparel",
    "womens apparel",
    "womens shoes",
    "womens footwear",
    "women accessories",
    "female fashion",
    "women",
    "womens"
  ]);

  const isWomen = [
    "women",
    "womens",
    "female",
    "woman",
    "womens fashion"
  ].includes(gender);

  const isMen = [
    "men",
    "mens",
    "male",
    "man",
    "mens fashion"
  ].includes(gender);

  return !isMen && (womenCategory || isWomen);
}





        if (selected.includes("men") && selected.includes("fashion")) {
          // Match category/subcategory metadata first. Some APIs store gender
          // separately or use a generic Fashion/Clothing category.
          const gender = normalize(
            product.gender || product.target_gender || product.for_gender ||
            product.audience || product.department || product.subcategory?.name ||
            product.sub_category?.name || ""
          );
          const menCategory = hasAny(categories, [
            "mens fashion", "men fashion", "mens clothing", "men clothing",
            "menswear", "men apparel", "mens apparel", "mens shoes",
            "mens footwear", "mens accessories", "men accessories", "male fashion",
            "mens", "men"
          ]);
          const womenCategory = hasAny(categories, [
            "womens fashion", "women fashion", "womens clothing", "women clothing",
            "womenswear", "women apparel", "womens apparel", "womens shoes",
            "womens footwear", "women accessories", "female fashion", "women", "womens"
          ]);
          return !womenCategory && (menCategory || ["men", "mens", "male", "man", "mens fashion"].includes(gender));
        }

        if (selected === "electronics" || selected.includes("electronics")) {

          // Electronics excludes products assigned to the more specific Mobiles

          // and TVs/Appliances categories.

          const isSpecificMobile = hasAny(categories, [
            "mobiles", "mobile", "mobile phones", "smartphones", "smart phones",
            "cell phones", "cellphone"
          ]);

          const isAppliance = hasAny(categories, [
            "tvs and appliances", "tv and appliances", "home appliances", "appliances", "televisions"
          ]);

          // If the database only labels a phone as Electronics, keep it out of
          // the general Electronics page. Do not use descriptions for filtering.
          const productName = normalize(
            product.name || product.title || product.product_name || product.productName || ""
          );
          const looksLikePhone = hasAny([productName], [
            "iphone", "smartphone", "mobile phone", "android phone", "cell phone", "feature phone"
          ]);

          if (isSpecificMobile || isAppliance || looksLikePhone) return false;

          return hasAny(categories, ["electronics", "electronic"]);

        }



        if (selected === "home and living" || selected.includes("home and living")) {

          return hasAny(categories, ["home and living", "home living", "home decor", "furniture", "kitchen and dining"]);

        }



        if (selected === "kids" || selected.includes("kids")) {

          return hasAny(categories, ["kids", "children", "kids fashion", "toys"]);

        }



        // For other categories, require an exact normalized category match.

        return categories.some((category) => category === selected);

      });



  if (loading) {

    return (

      <main className="nex-products-page">

        <style>{productsStyles}</style>

        <p className="nex-products-status">Loading products...</p>

      </main>

    );

  }



  if (error) {

    return (

      <main className="nex-products-page">

        <style>{productsStyles}</style>

        <p className="nex-products-status nex-products-error">{error}</p>

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

            <h1>{selectedCategory || "Find your next favorite."}</h1>

            <p>{selectedCategory ? `Products in ${selectedCategory}` : "Shop smarter. Live better."}</p>

          </div>

          <div className="nex-products-count">

            {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}

          </div>

        </header>



        {filteredProducts.length === 0 ? (

          <div className="nex-products-empty">

            <h3>{selectedCategory ? `No products found in ${selectedCategory}` : "No products available"}</h3>

            <p>{selectedCategory ? "Check that your products use this category in the database." : "Products will appear here when they are available in the catalogue."}</p>

          </div>

        ) : (

          <section className="nex-products-grid" aria-label="All products">

            {filteredProducts.map((product) => (

              <article className="nex-product-card" key={product.id}>

                <button

                  type="button"

                  className="nex-product-image"

                  onClick={() => navigate(`/products/${product.id}`)}

                  aria-label={`View ${product.name || "product"} details`}

                >

                  {product.image ? (

                    <img src={product.image} alt={product.name || "Product"} />

                  ) : (

                    <span className="nex-product-no-image">No image available</span>

                  )}



                  {Number(product.review_count) > 0 &&

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

                    {getProductCategory(product) || "Nexora"}

                  </p>

                  <button

                    type="button"

                    className="nex-product-name"

                    onClick={() => navigate(`/products/${product.id}`)}

                  >

                    {product.name || "Untitled product"}

                  </button>

                  <p className="nex-product-price">₹{product.price ?? "—"}</p>

                  <p

                    className={`nex-product-stock ${

                      Number(product.stock) > 0 ? "in-stock" : "out-stock"

                    }`}

                  >

                    {Number(product.stock) > 0

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

          </section>

        )}

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

    width: 100%;

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

  .nex-products-grid {

    display: grid;

    grid-template-columns: repeat(4, minmax(0, 1fr));

    gap: 20px;

    width: 100%;

  }

  .nex-product-card {

    display: flex;

    min-width: 0;

    min-height: 540px;

    flex-direction: column;

    overflow: hidden;

    border: 1px solid #e5e7eb;

    border-radius: 13px;

    background: #fff;

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

    height: 360px;

    padding: 12px;

    box-sizing: border-box;

    overflow: hidden;

    border: 0;

    background: #fff;

    cursor: pointer;

  }

  .nex-product-image img {

    display: block;

    width: 100%;

    height: 100%;

    max-width: 100%;

    max-height: 100%;

    object-fit: contain;

    object-position: center;

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

    color: #fff;

    font-size: 11px;

  }

  .nex-product-rating span { opacity: 0.85; }

  .nex-product-info {

    display: flex;

    flex: 1;

    flex-direction: column;

    padding: 16px;

  }

  .nex-product-category {

    margin: 0 0 7px;

    color: #0f766e;

    font-size: 11px;

  }

  .nex-product-name {

    display: -webkit-box;

    min-height: 44px;

    padding: 0;

    overflow: hidden;

    border: 0;

    background: transparent;

    color: #111827;

    font: inherit;

    font-size: 15px;

    line-height: 1.45;

    text-align: left;

    cursor: pointer;

    -webkit-box-orient: vertical;

    -webkit-line-clamp: 2;

  }

  .nex-product-name:hover { color: #0f766e; }

  .nex-product-price {

    margin: 13px 0 7px;

    color: #111827;

    font-size: 22px;

  }

  .nex-product-stock {

    margin: 0 0 15px;

    font-size: 12px;

  }

  .nex-product-stock.in-stock { color: #15803d; }

  .nex-product-stock.out-stock { color: #dc2626; }

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

  .nex-product-details-button:hover { background: #ccfbf1; }

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

    background: #fff;

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

  .nex-products-error { color: #dc2626; }

  @media (max-width: 1100px) {

    .nex-products-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }

    .nex-product-image { height: 300px; }

    .nex-product-card { min-height: 480px; }

  }

  @media (max-width: 760px) {

    .nex-products-page { padding: 25px 14px 40px; }

    .nex-products-heading { align-items: flex-start; }

    .nex-products-heading h1 { font-size: 26px; }

    .nex-products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }

    .nex-product-card { min-height: 420px; }

    .nex-product-image { height: 250px; }

    .nex-product-info { padding: 12px; }

    .nex-product-name { min-height: 38px; font-size: 13px; }

    .nex-product-price { font-size: 18px; }

  }

  @media (max-width: 420px) {

    .nex-products-page { padding-right: 10px; padding-left: 10px; }

    .nex-products-grid { gap: 8px; }

    .nex-product-card { min-height: 390px; }

    .nex-product-image { height: 210px; }

    .nex-product-info { padding: 9px; }

    .nex-product-price { font-size: 16px; }

    .nex-product-details-button { padding: 9px 5px; }

  }

`;



export default Products;
