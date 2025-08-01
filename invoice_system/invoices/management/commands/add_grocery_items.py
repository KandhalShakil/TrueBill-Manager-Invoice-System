import random
import urllib.parse
from django.core.management.base import BaseCommand
from items.models import Item
from invoices.models import Invoice, InvoiceItem

class Command(BaseCommand):
    help = 'Adds a specific list of 500 grocery items to the database with INR prices'

    def handle(self, *args, **options):
        # Clear existing invoices and items
        self.stdout.write('Clearing existing invoice data...')
        InvoiceItem.objects.all().delete()
        Invoice.objects.all().delete()
        self.stdout.write('Clearing existing grocery items...')
        Item.objects.all().delete()

        item_names = [
            "Potato", "Onion", "Tomato", "Carrot", "Beetroot", "Spinach", "Cauliflower", "Cabbage", "Broccoli", "Green Peas",
            "Lady Finger", "Bottle Gourd", "Ridge Gourd", "Bitter Gourd", "Pumpkin", "Garlic", "Ginger", "Green Chili", "Red Bell Pepper", "Yellow Bell Pepper",
            "Mushroom", "Zucchini", "Turnip", "Radish", "Brinjal", "Sweet Corn", "Tindora", "Spring Onion", "Leeks", "Drumstick",
            "Raw Banana", "Raw Mango", "Curry Leaves", "Coriander Leaves", "Mint Leaves", "Fenugreek Leaves", "Amaranth Leaves", "Ash Gourd", "Yam", "Snake Gourd",
            "Apple", "Banana", "Orange", "Papaya", "Pineapple", "Mango", "Grapes", "Watermelon", "Muskmelon", "Kiwi",
            "Pomegranate", "Guava", "Pear", "Lychee", "Plum", "Peach", "Dragon Fruit", "Chikoo", "Blueberry", "Strawberry",
            "Raspberry", "Avocado", "Coconut", "Dates", "Blackberries", "Lemon", "Sweet Lime", "Passion Fruit", "Star Fruit", "Gooseberry",
            "Jackfruit", "Figs", "Raisins", "Dried Apricots", "Canned Pineapple", "Canned Cherries", "Mixed Fruit Cup", "Canned Mango Pulp", "Frozen Mixed Berries", "Fruit Jelly Cup",
            "Basmati Rice", "Brown Rice", "Sona Masoori Rice", "Wheat Flour", "Maida", "Ragi Flour", "Bajra Flour", "Jowar Flour", "Semolina", "Corn Flour",
            "Poha", "Idli Rice", "Red Lentils", "Moong Dal", "Toor Dal", "Chana Dal", "Urad Dal", "Rajma", "Chole", "Black Chana",
            "Kabuli Chana", "Green Gram", "Horse Gram", "Split Peas", "Bengal Gram", "Barley", "Rolled Oats", "Quinoa", "Millets", "Biryani Rice",
            "Sago", "Couscous", "Vermicelli", "Broken Wheat", "Puffed Rice", "Pasta", "Noodles", "Macaroni", "Corn Grits", "Buckwheat",
            "Turmeric Powder", "Red Chili Powder", "Coriander Powder", "Cumin Powder", "Garam Masala", "Black Pepper", "Cloves", "Cardamom", "Cinnamon", "Bay Leaves",
            "Dry Mango Powder", "Fennel Seeds", "Mustard Seeds", "Carom Seeds", "Fenugreek Seeds", "Asafoetida", "Nutmeg", "Star Anise", "Sambar Masala", "Pav Bhaji Masala",
            "Chole Masala", "Biryani Masala", "Tea Masala", "Chaat Masala", "Kitchen King Masala", "Rasam Powder", "Fish Curry Masala", "Meat Masala", "Pickle Masala", "Garam Masala Paste",
            "Tandoori Masala", "Kasuri Methi", "Black Salt", "White Salt", "Rock Salt", "Lemon Salt", "Curry Powder", "Peri Peri Masala", "Italian Seasoning", "Taco Seasoning",
            "Mustard Oil", "Sunflower Oil", "Groundnut Oil", "Olive Oil", "Coconut Oil", "Rice Bran Oil", "Sesame Oil", "Soy Sauce", "Tomato Ketchup", "Chili Sauce",
            "Green Chili Sauce", "Schezwan Sauce", "Pasta Sauce", "Mayonnaise", "Barbecue Sauce", "Vinegar", "Apple Cider Vinegar", "Tamarind Paste", "Ginger Garlic Paste", "Mint Chutney",
            "Mango Chutney", "Pickle - Mango", "Pickle - Lemon", "Pickle - Mixed", "Peanut Butter", "Jam - Mixed Fruit", "Jam - Strawberry", "Honey", "Jaggery", "Salted Butter",
            "Ghee", "Margarine", "Cheese Spread", "Cheese Cubes", "Paneer", "Curd", "Cream", "Milk Powder", "Condensed Milk", "Sweetened Milk",
            "Biscuits - Glucose", "Biscuits - Cream", "Digestive Biscuits", "Chocolate Chip Cookies", "Potato Chips", "Banana Chips", "Nachos", "Popcorn", "Trail Mix", "Mixture",
            "Chakli", "Murukku", "Mathri", "Bhel Mix", "Roasted Chana", "Salted Peanuts", "Masala Cashews", "Chocolate Bar", "Candy", "Lollipop",
            "Ice Cream", "Kulfi", "Rasgulla", "Gulab Jamun", "Soan Papdi", "Kaju Katli", "Milk Cake", "Peda", "Laddu", "Halwa Mix",
            "Jelly", "Pudding Mix", "Brownie Mix", "Cake Mix", "Dry Fruit Halwa", "Coconut Barfi", "Chocolate Spread", "Swiss Roll", "Muffins", "Doughnuts",
            "Filter Coffee", "Instant Coffee", "Tea Powder", "Green Tea", "Lemon Tea", "Iced Tea", "Instant Coffee Mix", "Hot Chocolate", "Milk", "Soy Milk",
            "Almond Milk", "Buttermilk", "Lassi", "Energy Drink", "Soft Drink", "Lemonade", "Mango Juice", "Orange Juice", "Apple Juice", "Mixed Fruit Juice",
            "Coconut Water", "Protein Shake", "Milkshake Mix", "Rooh Afza", "Tang", "Glucon-D", "ORS", "Jaljeera", "Cold Coffee", "Sparkling Water",
            "Tonic Water", "Aam Panna", "Sugarcane Juice", "Herbal Tea", "Kombucha", "Electrolyte Drink", "Syrup - Rose", "Syrup - Kesar", "Thandai", "Soy Drink",
            "Dishwashing Liquid", "Floor Cleaner", "Toilet Cleaner", "Bathroom Cleaner", "Glass Cleaner", "Bleach", "Scrub Pad", "Dish Sponge", "Garbage Bags", "Room Freshener",
            "Air Freshener Spray", "Mosquito Repellent", "Cockroach Spray", "Phenyl", "Disinfectant", "Mop", "Broom", "Dustpan", "Toilet Brush", "Handwash",
            "Sanitizer", "Detergent Powder", "Detergent Liquid", "Fabric Softener", "Cloth Brush", "Washing Bar", "Laundry Basket", "Cleaning Gloves", "Microfiber Cloth", "Bucket",
            "Mug", "Dustbin", "Lint Roller", "Ironing Spray", "Stain Remover", "Floor Wiper", "Vacuum Bag", "Toilet Roll", "Kitchen Roll", "Napkins",
            "Bath Soap", "Shampoo", "Conditioner", "Hair Oil", "Face Wash", "Body Lotion", "Moisturizer", "Sunscreen", "Lip Balm", "Face Cream",
            "Deodorant", "Perfume", "Talcum Powder", "Toothpaste", "Toothbrush", "Mouthwash", "Dental Floss", "Shaving Cream", "Razor", "Hair Gel",
            "Face Mask", "Facial Wipes", "Nail Cutter", "Cotton Balls", "Cotton Swabs", "Feminine Wash", "Sanitary Napkins", "Tampons", "Diapers", "Baby Wipes",
            "Baby Powder", "Baby Shampoo", "Baby Oil", "Baby Lotion", "Beard Oil", "Beard Wash", "Foot Cream", "Hand Cream", "Anti-Dandruff Shampoo", "Ayurvedic Soap",
            "Disposable Plates", "Disposable Glasses", "Paper Cups", "Plastic Spoons", "Cling Film", "Aluminum Foil", "Zip Lock Bags", "Food Storage Containers", "Tiffin Box", "Ice Tray",
            "Matchbox", "Candle", "Gas Lighter", "Napthalene Balls", "Shoe Polish", "Inverter Battery", "AA Battery", "AAA Battery", "Extension Board", "Electric Kettle",
            "Bread", "Brown Bread", "Multigrain Bread", "White Bread", "Pizza Base", "Burger Bun", "Pav", "Kulcha", "Khari Biscuit", "Rusk",
            "Custard Powder", "Cornflakes", "Muesli", "Wheat Flakes", "Chocolate Syrup", "Coffee Syrup", "Sprinkles", "Cake Toppings", "Baking Powder", "Baking Soda",
            "Yeast", "Vanilla Essence", "Food Color", "Gelatin", "Ice Cream Cone", "Waffle", "Bread Crumbs", "Corn Starch", "Cooking Spray", "Instant Soup",
            "Noodle Soup", "Cup Noodles", "Ready-to-Eat Pulao", "Instant Upma", "Instant Poha", "Instant Idli Mix", "Instant Dosa Mix", "Instant Vada Mix", "Ready Chapati", "Frozen Paratha",
            "Frozen Pizza", "Frozen Momos", "Frozen French Fries", "Frozen Veg Cutlet", "Frozen Samosa", "Frozen Nuggets", "Paneer Tikka", "Chicken Tikka", "Veg Biryani", "Chicken Biryani",
            "Mutton Curry", "Palak Paneer", "Dal Makhani", "Chole Masala", "Butter Chicken", "Ready Gravies", "Khichdi Mix", "Pasta Mix", "Schezwan Fried Rice Mix", "Gobi Manchurian Mix",
            "Ready Chapati Roll", "Garlic Naan", "Jeera Rice", "Tamarind Rice", "Lemon Rice", "Curd Rice", "Masala Rice", "Dry Coconut", "Grated Coconut", "Coconut Milk",
            "Curry Paste", "White Vinegar", "Soybean", "Whole Wheat", "Rice Flour", "Corn Meal", "Multigrain Flour", "Bread Flour", "Cake Flour", "Almonds",
            "Cashews", "Walnuts", "Pistachios", "Peanuts", "Sunflower Seeds", "Pumpkin Seeds", "Flax Seeds", "Chia Seeds", "Mixed Seeds", "Dates Syrup",
            "Fennel Candy", "Mouth Freshener", "Ice Cream Mix", "Rose Water", "Kesar", "Cardamom Powder", "Poppy Seeds", "Chironji", "Betel Leaves", "Supari",
            "Dry Ginger", "Sugar", "Brown Sugar", "Castor Sugar", "Rock Candy", "Glucose Powder", "Icing Sugar", "Liquid Glucose", "Syrup Base", "Instant Coffee Pods",
            "Green Coffee", "Protein Bars", "Weight Gain Powder", "Diet Biscuit", "Keto Mix", "Low Carb Atta", "Diabetic Atta", "Herbal Juice", "Immunity Booster", "Vitamin C Tablets"
        ]

        for i, name in enumerate(item_names):
            price = random.randint(10, 2500)
            stock = random.randint(20, 200)
            
            Item.objects.create(
                name=name,
                price=price,
                stock=stock
            )

        self.stdout.write(self.style.SUCCESS(f'Successfully added {len(item_names)} specific items to the database.')) 