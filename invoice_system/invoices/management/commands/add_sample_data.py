from django.core.management.base import BaseCommand
from items.models import Item
from decimal import Decimal
import random

class Command(BaseCommand):
    help = 'Add 500 grocery items for testing'

    def handle(self, *args, **options):
        self.stdout.write('Adding 500 grocery items...')

        grocery_names = [
            'Apple', 'Banana', 'Orange', 'Grapes', 'Mango', 'Pineapple', 'Strawberry', 'Blueberry', 'Watermelon', 'Papaya',
            'Pear', 'Peach', 'Plum', 'Kiwi', 'Lemon', 'Lime', 'Coconut', 'Avocado', 'Cherry', 'Pomegranate',
            'Tomato', 'Potato', 'Onion', 'Carrot', 'Broccoli', 'Cauliflower', 'Spinach', 'Lettuce', 'Cabbage', 'Celery',
            'Cucumber', 'Pumpkin', 'Radish', 'Beetroot', 'Turnip', 'Sweet Potato', 'Garlic', 'Ginger', 'Peas', 'Corn',
            'Eggplant', 'Zucchini', 'Bell Pepper', 'Chili', 'Okra', 'Bitter Gourd', 'Bottle Gourd', 'Yam', 'Artichoke', 'Leek',
            'Rice', 'Wheat Flour', 'Maida', 'Sooji', 'Poha', 'Oats', 'Barley', 'Millet', 'Cornmeal', 'Quinoa',
            'Sugar', 'Salt', 'Jaggery', 'Honey', 'Tea', 'Coffee', 'Green Tea', 'Black Tea', 'Milk Powder', 'Condensed Milk',
            'Butter', 'Ghee', 'Cheese', 'Paneer', 'Curd', 'Yogurt', 'Cream', 'Tofu', 'Soy Milk', 'Almond Milk',
            'Eggs', 'Chicken', 'Mutton', 'Fish', 'Prawns', 'Crab', 'Duck', 'Turkey', 'Bacon', 'Sausage',
            'Bread', 'Bun', 'Rusk', 'Bagel', 'Croissant', 'Muffin', 'Cake', 'Pastry', 'Biscuit', 'Cookie',
            'Oil', 'Olive Oil', 'Sunflower Oil', 'Mustard Oil', 'Coconut Oil', 'Groundnut Oil', 'Sesame Oil', 'Soybean Oil', 'Butter Oil', 'Vanaspati',
            'Dal', 'Chana Dal', 'Toor Dal', 'Moong Dal', 'Masoor Dal', 'Urad Dal', 'Rajma', 'Chickpeas', 'Lobia', 'Green Gram',
            'Almonds', 'Cashews', 'Walnuts', 'Pistachios', 'Raisins', 'Dates', 'Figs', 'Peanuts', 'Hazelnuts', 'Pine Nuts',
            'Apple Juice', 'Orange Juice', 'Mango Juice', 'Grape Juice', 'Pineapple Juice', 'Lassi', 'Buttermilk', 'Soda', 'Cola', 'Lemonade',
            'Ketchup', 'Mayonnaise', 'Mustard', 'Vinegar', 'Soy Sauce', 'Chili Sauce', 'Barbecue Sauce', 'Salad Dressing', 'Pickle', 'Jam',
            'Cornflakes', 'Muesli', 'Granola', 'Pasta', 'Noodles', 'Vermicelli', 'Macaroni', 'Spaghetti', 'Lasagna', 'Ravioli',
            'Soup', 'Broth', 'Stock', 'Bouillon', 'Instant Soup', 'Canned Soup', 'Frozen Peas', 'Frozen Corn', 'Frozen Spinach', 'Frozen Mixed Veg',
            'Ice Cream', 'Frozen Yogurt', 'Popsicle', 'Kulfi', 'Chocolate', 'Candy', 'Toffee', 'Gum', 'Mints', 'Lollipop',
            'Sambar Powder', 'Rasam Powder', 'Garam Masala', 'Coriander Powder', 'Cumin Powder', 'Turmeric Powder', 'Red Chili Powder', 'Black Pepper', 'Cloves', 'Cardamom',
            'Cinnamon', 'Nutmeg', 'Mace', 'Bay Leaf', 'Star Anise', 'Fennel Seeds', 'Mustard Seeds', 'Fenugreek Seeds', 'Carom Seeds', 'Sesame Seeds',
            'Soap', 'Shampoo', 'Toothpaste', 'Toothbrush', 'Detergent', 'Dishwash Liquid', 'Floor Cleaner', 'Phenyl', 'Handwash', 'Sanitizer',
            'Tissue Paper', 'Toilet Paper', 'Napkin', 'Aluminum Foil', 'Cling Film', 'Garbage Bag', 'Matchbox', 'Candle', 'Mosquito Coil', 'Agarbatti',
            'Shaving Cream', 'Razor', 'Aftershave', 'Face Wash', 'Moisturizer', 'Lotion', 'Sunscreen', 'Lip Balm', 'Hair Oil', 'Comb',
            'Notebook', 'Pen', 'Pencil', 'Eraser', 'Sharpener', 'Scale', 'Marker', 'Highlighter', 'Stapler', 'Glue Stick',
            'Battery', 'Bulb', 'Tube Light', 'Extension Cord', 'Plug', 'Socket', 'Switch', 'Wire', 'Tape', 'Fuse',
            'Cleaning Brush', 'Scrubber', 'Mop', 'Broom', 'Dustpan', 'Bucket', 'Mug', 'Jug', 'Bottle', 'Tumbler',
            'Lunch Box', 'Tiffin', 'Water Bottle', 'Thermos', 'Flask', 'Plate', 'Bowl', 'Spoon', 'Fork', 'Knife',
            'Chips', 'Namkeen', 'Mixture', 'Sev', 'Bhujia', 'Papad', 'Khakhra', 'Murukku', 'Chakli', 'Fryums',
            'Pickle', 'Chutney', 'Sauce', 'Syrup', 'Essence', 'Food Color', 'Baking Powder', 'Baking Soda', 'Yeast', 'Custard Powder',
            'Corn Starch', 'Gelatin', 'Agar Agar', 'Vermicelli', 'Rice Noodles', 'Rice Paper', 'Spring Roll Sheet', 'Wonton Wrapper', 'Bread Crumbs', 'Panko',
            'Paneer Tikka', 'Chicken Tikka', 'Fish Fingers', 'Veg Nuggets', 'Chicken Nuggets', 'Veg Patty', 'Chicken Patty', 'Veg Sausage', 'Chicken Sausage', 'Veg Burger',
            'Chicken Burger', 'Veg Pizza', 'Chicken Pizza', 'Frozen Paratha', 'Frozen Roti', 'Frozen Naan', 'Frozen Dosa', 'Frozen Idli', 'Frozen Vada', 'Frozen Samosa',
        ]

        items_data = []
        for i in range(500):
            name = grocery_names[i] if i < len(grocery_names) else f'Grocery Item {i+1}'
            price = Decimal(str(round(random.uniform(10, 500), 2)))
            stock = random.randint(5, 100)
            items_data.append({'name': name, 'price': price, 'stock': stock})

        created_count = 0
        for item_data in items_data:
            item, created = Item.objects.get_or_create(
                name=item_data['name'],
                defaults={
                    'price': item_data['price'],
                    'stock': item_data['stock']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f'Created item: {item.name} - ₹{item.price}')
            else:
                self.stdout.write(f'Item already exists: {item.name}')
        
        self.stdout.write(self.style.SUCCESS(f'{created_count} grocery items added successfully!')) 