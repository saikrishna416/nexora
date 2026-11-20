
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from products.models import Category, Product


# Catalog categories based on the 11 departments shared earlier.
DEPARTMENTS = {
    "Men's Fashion": [
        "Top Wear", "Shirts", "Casual Shirts", "Formal Shirts",
        "T-Shirts", "Polo T-Shirts", "Sweatshirts", "Hoodies",
        "Jackets", "Coats", "Suits & Blazers", "Ethnic Wear",
        "Kurtas", "Sherwanis", "Bottom Wear", "Jeans",
        "Casual Trousers", "Formal Trousers", "Track Pants", "Shorts",
        "Innerwear", "Sleepwear", "Men's Shoes", "Casual Shoes",
        "Formal Shoes", "Sneakers", "Sandals & Slippers", "Watches",
        "Belts", "Wallets", "Bags & Backpacks", "Sunglasses",
        "Accessories",
    ],
    "Women's Fashion": [
        "Tops & T-Shirts", "Shirts", "Kurtis", "Kurtas",
        "Ethnic Sets", "Sarees", "Blouses", "Lehengas",
        "Salwar Suits", "Dresses", "Gowns", "Jumpsuits",
        "Jeans", "Trousers", "Leggings", "Palazzos", "Skirts",
        "Shorts", "Co-ord Sets", "Sweaters", "Sweatshirts",
        "Jackets & Coats", "Innerwear", "Sleepwear", "Maternity Wear",
        "Women's Shoes", "Heels", "Flats", "Sneakers", "Sandals",
        "Handbags", "Clutches", "Backpacks", "Jewellery", "Watches",
        "Sunglasses", "Belts & Accessories",
    ],
    "Kids": [
        "Boys' Clothing", "Girls' Clothing", "Infant Wear",
        "Newborn Clothing", "Baby Rompers", "Baby Sets", "T-Shirts",
        "Shirts", "Tops", "Dresses", "Ethnic Wear", "Jeans & Trousers",
        "Shorts", "Leggings & Jeggings", "Skirts", "Sweaters",
        "Hoodies", "Jackets", "Rainwear", "School Uniforms",
        "School Shoes", "Kids' Sneakers", "Sandals & Slippers",
        "Booties", "Kids' Sports Shoes", "Diapers", "Wipes",
        "Baby Bath & Skin Care", "Baby Feeding", "Baby Bedding",
        "Baby Carriers", "Strollers", "Car Seats", "Toys",
        "Educational Toys", "Building Blocks", "Dolls", "Action Figures",
        "Remote-Control Toys", "Puzzles & Board Games", "Soft Toys",
        "Outdoor Play", "Cycles & Ride-ons", "School Bags",
        "Lunch Bags & Bottles", "Kids' Watches", "Hair Accessories",
    ],
    "Electronics": [
        "Mobiles", "Smartphones", "Feature Phones", "Tablets",
        "Laptops", "Desktop Computers", "Monitors",
        "Computer Accessories", "Keyboards", "Mice",
        "Printers & Scanners", "External Storage", "Pen Drives",
        "Hard Drives & SSDs", "Headphones", "Earphones",
        "True Wireless Earbuds", "Bluetooth Speakers", "Home Audio",
        "Smart Watches", "Fitness Bands", "Cameras",
        "DSLR & Mirrorless Cameras", "Action Cameras",
        "Camera Lenses & Accessories", "Gaming Consoles",
        "Gaming Accessories", "Routers & Networking", "Power Banks",
        "Chargers & Cables", "Adapters", "Webcams", "Projectors",
        "Batteries",
    ],
    "TVs & Home Entertainment": [
        "LED TVs", "Smart TVs", "Android TVs", "OLED TVs", "QLED TVs",
        "4K Ultra HD TVs", "Full HD TVs", "Large-Screen TVs",
        "TV Stands & Wall Mounts", "TV Cables & Accessories",
        "Streaming Devices", "Set-Top Boxes", "Projectors", "Soundbars",
        "Home Theatre Systems", "Speakers", "AV Receivers",
        "DVD & Blu-ray Players", "Remote Controls",
    ],
    "Appliances": [
        "Refrigerators", "Single Door Refrigerators",
        "Double Door Refrigerators", "Side-by-Side Refrigerators",
        "French Door Refrigerators", "Deep Freezers", "Washing Machines",
        "Front Load Washing Machines", "Top Load Washing Machines",
        "Semi-Automatic Washing Machines", "Washer-Dryer Combos",
        "Air Conditioners", "Split ACs", "Window ACs", "Portable ACs",
        "Air Coolers", "Air Purifiers", "Water Purifiers",
        "RO Water Purifiers", "Microwave Ovens", "Convection Ovens",
        "Dishwashers", "Geysers & Water Heaters", "Vacuum Cleaners",
        "Robot Vacuum Cleaners", "Irons & Garment Steamers", "Fans",
        "Room Heaters", "Dehumidifiers", "Sewing Machines",
        "Inverters & Batteries", "Voltage Stabilizers",
        "Home Appliance Accessories",
    ],
    "Kitchen Appliances": [
        "Mixer Grinders", "Juicers", "Hand Blenders", "Food Processors",
        "Electric Kettles", "Toasters", "Sandwich Makers", "Air Fryers",
        "Induction Cooktops", "Electric Cooktops", "Rice Cookers",
        "Pressure Cookers", "Electric Pressure Cookers", "Coffee Makers",
        "Espresso Machines", "Milk Frothers", "OTG Ovens", "Hand Mixers",
        "Choppers", "Grills & Griddles", "Bread Makers", "Kitchen Scales",
        "Cookware Sets", "Pots & Pans", "Non-Stick Cookware",
        "Kitchen Tools & Accessories",
    ],
    "Home & Living": [
        "Sofas & Sofa Beds", "Beds & Bed Frames", "Mattresses",
        "Wardrobes", "Cabinets & Drawers", "TV Units", "Study Tables",
        "Office Furniture", "Dining Tables & Chairs", "Coffee Tables",
        "Bookshelves", "Shoe Racks", "Bean Bags", "Outdoor Furniture",
        "Bedsheets", "Comforters & Quilts", "Blankets",
        "Pillows & Cushions", "Mattress Protectors", "Curtains & Blinds",
        "Carpets & Rugs", "Towels & Bath Linen", "Lighting",
        "Ceiling Lights", "Table Lamps", "Floor Lamps", "Wall Lights",
        "Home Décor", "Wall Art", "Clocks", "Vases & Planters", "Mirrors",
        "Candles & Fragrance", "Storage & Organizers", "Laundry Baskets",
        "Kitchen & Dining", "Dinner Sets", "Crockery", "Glassware",
        "Cutlery", "Water Bottles", "Bathroom Accessories", "Doormats",
        "Cleaning Supplies", "Garden & Outdoor", "DIY & Home Improvement",
    ],
    "Beauty & Personal Care": [
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
    "Sports & Fitness": [
        "Fitness Equipment", "Dumbbells & Weights", "Resistance Bands",
        "Treadmills", "Exercise Bikes", "Yoga Mats", "Yoga Accessories",
        "Sports Shoes", "Running Shoes", "Cricket", "Football",
        "Badminton", "Tennis", "Basketball", "Table Tennis", "Swimming",
        "Cycling", "Bicycles", "Helmets & Safety Gear", "Camping & Hiking",
        "Trekking Gear", "Outdoor Gear", "Fishing Gear", "Sports Clothing",
        "Tracksuits", "Gym Gloves & Belts", "Sports Bags", "Water Bottles",
        "Fitness Trackers", "Recovery & Massage",
    ],
    "Books & Stationery": [
        "Fiction Books", "Non-Fiction Books", "Educational Books",
        "Children's Books", "Competitive Exam Books",
        "Comics & Graphic Novels", "Notebooks & Diaries",
        "Pens & Pencils", "Art Supplies", "School Supplies",
        "Office Supplies", "Printers & Paper",
    ],
}


# Explicit product names for the initial fashion categories.
# Extend this mapping when you want specific names for other categories.
PRODUCTS_BY_CATEGORY = {
    "Top Wear": [
        ("Men's Classic Cotton Shirt",
         "Cotton shirt designed for comfortable everyday wear.", 999, 20),
        ("Men's Textured Casual Shirt",
         "Textured casual shirt for relaxed outings and daily styling.", 1299, 15),
    ],
    "Shirts": [
        ("Men's Slim Fit Formal Shirt",
         "Slim-fit formal shirt suitable for office and events.", 1199, 20),
        ("Men's Regular Fit Oxford Shirt",
         "Regular-fit Oxford shirt for versatile everyday styling.", 1399, 12),
    ],
    "Casual Shirts": [
        ("Men's Checked Casual Shirt",
         "Checked casual shirt for everyday outfits.", 1099, 18),
        ("Men's Linen Blend Casual Shirt",
         "Lightweight linen-blend shirt for warm-weather wear.", 1499, 10),
    ],
    "Formal Shirts": [
        ("Men's White Formal Shirt",
         "Classic white formal shirt for business and occasions.", 1299, 20),
        ("Men's Blue Office Shirt",
         "Blue office shirt with a clean, versatile design.", 1399, 15),
    ],
    "T-Shirts": [
        ("Men's Classic Crew Neck T-Shirt",
         "Crew-neck T-shirt for comfortable daily wear.", 599, 30),
        ("Men's Premium Polo T-Shirt",
         "Polo T-shirt for smart casual outfits.", 899, 20),
    ],
    "Jeans": [
        ("Men's Classic Straight Fit Jeans",
         "Straight-fit denim jeans for everyday use.", 1499, 20),
        ("Men's Slim Fit Stretch Jeans",
         "Slim-fit jeans with stretch for ease of movement.", 1799, 15),
    ],
    "Casual Trousers": [
        ("Men's Everyday Chino Trousers",
         "Versatile chino trousers for casual outfits.", 1299, 18),
        ("Men's Tapered Fit Trousers",
         "Tapered trousers designed for a neat casual look.", 1599, 12),
    ],
    "Sneakers": [
        ("Men's Everyday Low-Top Sneakers",
         "Low-top sneakers for everyday casual wear.", 1999, 15),
        ("Men's Lightweight Street Sneakers",
         "Lightweight street-style sneakers for daily outings.", 2499, 10),
    ],
    "Tops & T-Shirts": [
        ("Women's Classic Cotton Top",
         "Cotton top for everyday casual styling.", 699, 20),
        ("Women's Ribbed Crew Neck T-Shirt",
         "Ribbed crew-neck T-shirt for versatile outfits.", 799, 15),
    ],
    "Kurtis": [
        ("Women's Printed Everyday Kurti",
         "Printed kurti suitable for casual daily wear.", 999, 20),
        ("Women's Straight-Cut Kurti",
         "Straight-cut kurti for a simple, versatile look.", 1299, 12),
    ],
    "Sarees": [
        ("Women's Classic Printed Saree",
         "Printed saree for festive and occasion wear.", 1799, 10),
        ("Women's Lightweight Everyday Saree",
         "Lightweight saree designed for comfortable wear.", 1499, 12),
    ],
    "Dresses": [
        ("Women's Floral Midi Dress",
         "Floral midi dress for casual outings.", 1599, 15),
        ("Women's Classic A-Line Dress",
         "A-line dress with a versatile everyday silhouette.", 1899, 10),
    ],
    "Smartphones": [
        ("Nova X 5G Smartphone",
         "5G smartphone listing; confirm specifications before sale.", 14999, 10),
        ("Pulse Pro 5G Smartphone",
         "Smartphone listing; confirm storage and specifications before sale.", 19999, 8),
    ],
    "Laptops": [
        ("Everyday 14-Inch Laptop",
         "Laptop listing for work and study; verify specifications before sale.", 42999, 8),
        ("Performance 15-Inch Laptop",
         "Laptop listing for productivity; verify specifications before sale.", 58999, 5),
    ],
    "Headphones": [
        ("Studio Comfort Over-Ear Headphones",
         "Over-ear headphones for everyday listening.", 1999, 20),
        ("Wireless Bass Headphones",
         "Wireless headphone listing; verify battery and audio specifications.", 2999, 12),
    ],
    "Earphones": [
        ("Wired In-Ear Earphones",
         "Compact wired earphones for everyday listening.", 399, 30),
        ("Wireless Neckband Earphones",
         "Wireless neckband earphones; verify battery specifications.", 1299, 15),
    ],
    "Power Banks": [
        ("Compact 10000mAh Power Bank",
         "Portable power bank; verify compatibility and rated capacity.", 999, 20),
        ("High-Capacity 20000mAh Power Bank",
         "High-capacity power bank; verify output and device compatibility.", 1799, 12),
    ],
    "Chargers & Cables": [
        ("USB-C Fast Charging Cable",
         "USB-C cable; verify supported charging speed and compatibility.", 299, 30),
        ("Universal USB-C Wall Charger",
         "Wall charger; verify wattage and supported charging protocols.", 999, 20),
    ],
}


def generated_products(category_name):
    """Create two distinct draft names for categories without explicit entries."""
    return [
        (
            f"Classic {category_name}",
            f"Classic {category_name.lower()} selection. Verify materials, "
            "dimensions, compatibility, and specifications before sale.",
            999,
            15,
        ),
        (
            f"Premium {category_name}",
            f"Premium {category_name.lower()} selection. Confirm the exact "
            "product details and specifications before publishing.",
            1499,
            10,
        ),
    ]


class Command(BaseCommand):
    help = "Import two products per Nexora category without images"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--apply", action="store_true")
        parser.add_argument("--limit-categories", type=int, default=5)

    def handle(self, *args, **options):
        entries = [
            (department, category)
            for department, categories in DEPARTMENTS.items()
            for category in categories
        ]

        limit = options["limit_categories"]
        if limit < 1:
            raise CommandError("--limit-categories must be at least 1")

        entries = entries[:limit]

        self.stdout.write(f"Categories selected: {len(entries)}")
        self.stdout.write(f"Maximum products to consider: {len(entries) * 2}")
        self.stdout.write(f"Current products: {Product.objects.count()}")

        if options["dry_run"] or not options["apply"]:
            self.stdout.write(
                self.style.WARNING(
                    "Preview only; no database changes were made. "
                    "Use --apply to create products."
                )
            )
            for department, category in entries:
                self.stdout.write(f"  {department} > {category}")
            return

        created = 0
        skipped = 0

        with transaction.atomic():
            for department_name, category_name in entries:
                department, _ = Category.objects.get_or_create(
                    name=department_name,
                    parent=None,
                    defaults={
                        "description": f"{department_name} products",
                    },
                )

                category, _ = Category.objects.get_or_create(
                    name=category_name,
                    parent=department,
                    defaults={
                        "description": f"{category_name} products",
                    },
                )

                products = PRODUCTS_BY_CATEGORY.get(
                    category_name,
                    generated_products(category_name),
                )

                for name, description, price, stock in products:
                    if Product.objects.filter(
                        category=category,
                        name=name,
                    ).exists():
                        skipped += 1
                        self.stdout.write(f"Skipped existing: {name}")
                        continue

                    Product.objects.create(
                        category=category,
                        name=name,
                        description=description,
                        price=Decimal(str(price)),
                        stock=stock,
                        is_active=True,
                    )
                    created += 1
                    self.stdout.write(f"Created: {name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Import finished. Created: {created}; skipped: {skipped}. "
                "No images were downloaded or assigned."
            )
        )
