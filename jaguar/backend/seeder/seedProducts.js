// Seeds the database with 5000 sample products per category (50,000 total) for visual/testing purposes.
// Run from the project ROOT folder with:  npm run seed
// (Requires DB_URI in backend/config/config.env to be set to a working MongoDB instance)
// NOTE: this deletes all existing products before reseeding. Takes a few minutes to run.

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';

dotenv.config({ path: 'backend/config/config.env' });

const categories = [
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Books',
  'Sports',
  'Beauty',
  'Toys',
  'Grocery',
  'Automotive',
  'Furniture',
];

const adjectives = [
  'Premium', 'Classic', 'Modern', 'Deluxe', 'Compact', 'Portable', 'Wireless',
  'Smart', 'Eco-Friendly', 'Professional', 'Ultra', 'Essential', 'Lightweight',
  'Durable', 'Elegant', 'Advanced', 'Vintage', 'All-in-One', 'Rechargeable', 'Ergonomic',
];

const nouns = {
  Electronics: ['Headphones', 'Bluetooth Speaker', 'Smartwatch', 'Power Bank', 'Laptop Stand', 'USB Hub', 'Webcam', 'Keyboard', 'Mouse', 'Monitor'],
  Fashion: ['T-Shirt', 'Jeans', 'Jacket', 'Sneakers', 'Backpack', 'Sunglasses', 'Watch', 'Belt', 'Cap', 'Scarf'],
  'Home & Kitchen': ['Blender', 'Cookware Set', 'Vacuum Cleaner', 'Air Fryer', 'Coffee Maker', 'Toaster', 'Dinner Set', 'Storage Box', 'Bedsheet Set', 'Table Lamp'],
  Books: ['Novel', 'Cookbook', 'Biography', 'Self-Help Guide', 'Textbook', 'Comic Collection', 'Poetry Collection', 'Travel Guide', 'History Book', 'Notebook Set'],
  Sports: ['Yoga Mat', 'Dumbbell Set', 'Cricket Bat', 'Football', 'Running Shoes', 'Gym Bag', 'Skipping Rope', 'Cycling Helmet', 'Badminton Racket', 'Fitness Tracker'],
  Beauty: ['Face Cream', 'Shampoo', 'Perfume', 'Lipstick', 'Hair Dryer', 'Trimmer', 'Sunscreen', 'Face Wash', 'Nail Kit', 'Makeup Brush Set'],
  Toys: ['Building Blocks', 'Remote Car', 'Puzzle Set', 'Action Figure', 'Board Game', 'Soft Toy', 'Drone', 'Doll House', 'Art Kit', 'Toy Train'],
  Grocery: ['Organic Rice Pack', 'Green Tea Box', 'Spice Combo', 'Snack Pack', 'Cold Pressed Oil', 'Honey Jar', 'Dry Fruits Pack', 'Cereal Box', 'Coffee Powder', 'Pasta Pack'],
  Automotive: ['Car Vacuum Cleaner', 'Dash Cam', 'Car Cover', 'Tire Inflator', 'Seat Cover Set', 'Car Charger', 'Phone Mount', 'Steering Wheel Cover', 'Car Freshener', 'Tool Kit'],
  Furniture: ['Office Chair', 'Study Table', 'Bookshelf', 'Sofa Set', 'Bed Frame', 'Wardrobe', 'Shoe Rack', 'TV Unit', 'Dining Table', 'Recliner'],
};

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPrice = () => randomInt(199, 49999);
const randomRating = () => Math.round((Math.random() * 5) * 10) / 10;

// Maps each product noun to clean keywords for fetching a genuinely relevant photo (via LoremFlickr).
const nounKeywords = {
  Headphones: 'headphones', 'Bluetooth Speaker': 'bluetooth-speaker,speaker', Smartwatch: 'smartwatch',
  'Power Bank': 'power-bank,charger', 'Laptop Stand': 'laptop-stand,laptop', 'USB Hub': 'usb,electronics',
  Webcam: 'webcam', Keyboard: 'keyboard,computer', Mouse: 'computer-mouse', Monitor: 'monitor,computer-screen',
  'T-Shirt': 'tshirt,clothing', Jeans: 'jeans,denim', Jacket: 'jacket,clothing', Sneakers: 'sneakers,shoes',
  Backpack: 'backpack,bag', Sunglasses: 'sunglasses', Watch: 'wristwatch', Belt: 'leather-belt', Cap: 'cap,hat', Scarf: 'scarf',
  Blender: 'blender,kitchen', 'Cookware Set': 'cookware,pots', 'Vacuum Cleaner': 'vacuum-cleaner', 'Air Fryer': 'air-fryer,kitchen',
  'Coffee Maker': 'coffee-maker', Toaster: 'toaster,kitchen', 'Dinner Set': 'dinnerware,plates', 'Storage Box': 'storage-box',
  'Bedsheet Set': 'bedsheet,bedroom', 'Table Lamp': 'table-lamp,lamp',
  Novel: 'book,novel', Cookbook: 'cookbook,recipes', Biography: 'book,biography', 'Self-Help Guide': 'book,selfhelp',
  Textbook: 'textbook,books', 'Comic Collection': 'comicbook', 'Poetry Collection': 'poetry,book', 'Travel Guide': 'travel-book',
  'History Book': 'history-book', 'Notebook Set': 'notebook,stationery',
  'Yoga Mat': 'yoga-mat,yoga', 'Dumbbell Set': 'dumbbells,gym', 'Cricket Bat': 'cricket-bat,cricket', Football: 'football,soccer',
  'Running Shoes': 'running-shoes,sneakers', 'Gym Bag': 'gym-bag', 'Skipping Rope': 'jump-rope', 'Cycling Helmet': 'bike-helmet',
  'Badminton Racket': 'badminton,racket', 'Fitness Tracker': 'fitness-tracker,smartwatch',
  'Face Cream': 'skincare,cream', Shampoo: 'shampoo,haircare', Perfume: 'perfume,fragrance', Lipstick: 'lipstick,makeup',
  'Hair Dryer': 'hairdryer', Trimmer: 'trimmer,grooming', Sunscreen: 'sunscreen,skincare', 'Face Wash': 'facewash,skincare',
  'Nail Kit': 'nailpolish,manicure', 'Makeup Brush Set': 'makeup-brush,cosmetics',
  'Building Blocks': 'building-blocks,toys', 'Remote Car': 'toy-car,rc-car', 'Puzzle Set': 'jigsaw-puzzle',
  'Action Figure': 'action-figure,toy', 'Board Game': 'board-game', 'Soft Toy': 'teddy-bear,plush', Drone: 'drone,quadcopter',
  'Doll House': 'dollhouse,toy', 'Art Kit': 'art-supplies,crayons', 'Toy Train': 'toy-train',
  'Organic Rice Pack': 'rice,grain', 'Green Tea Box': 'green-tea', 'Spice Combo': 'spices,indian-spices', 'Snack Pack': 'snacks',
  'Cold Pressed Oil': 'cooking-oil', 'Honey Jar': 'honey,jar', 'Dry Fruits Pack': 'dryfruits,nuts', 'Cereal Box': 'cereal,breakfast',
  'Coffee Powder': 'coffee,coffee-beans', 'Pasta Pack': 'pasta',
  'Car Vacuum Cleaner': 'car-vacuum,car-interior', 'Dash Cam': 'dashcam,car', 'Car Cover': 'car-cover,car',
  'Tire Inflator': 'tire,car-tire', 'Seat Cover Set': 'car-seat,car-interior', 'Car Charger': 'car-charger',
  'Phone Mount': 'phone-mount,car', 'Steering Wheel Cover': 'steering-wheel,car', 'Car Freshener': 'car-freshener', 'Tool Kit': 'toolkit,tools',
  'Office Chair': 'office-chair,chair', 'Study Table': 'study-table,desk', Bookshelf: 'bookshelf,shelf', 'Sofa Set': 'sofa,livingroom',
  'Bed Frame': 'bedframe,bedroom', Wardrobe: 'wardrobe,closet', 'Shoe Rack': 'shoe-rack', 'TV Unit': 'tv-unit,television',
  'Dining Table': 'dining-table,diningroom', Recliner: 'recliner,armchair',
};

const getImageUrl = (noun, globalIndex) => {
  const keywords = nounKeywords[noun] || noun.toLowerCase().replace(/\s+/g, '-');
  return `https://loremflickr.com/600/600/${keywords}?lock=${globalIndex}`;
};

const PRODUCTS_PER_CATEGORY = 5000;
const BATCH_SIZE = 1000;
const ADMIN_EMAIL = 'chodipilliajay165@gmail.com';

const generateProductsForCategory = (category, adminUserId, startIndex) => {
  const products = [];
  for (let i = 0; i < PRODUCTS_PER_CATEGORY; i++) {
    const globalIndex = startIndex + i;
    const noun = randomFrom(nouns[category]);
    const adjective = randomFrom(adjectives);
    const name = `${adjective} ${noun} ${globalIndex}`;
    const price = randomPrice();
    // ~40% of products get a discount (cutPrice higher than price).
    const hasDiscount = Math.random() < 0.4;
    const cutPrice = hasDiscount ? Math.round(price * (1 + randomInt(10, 60) / 100)) : 0;

    products.push({
      name,
      description: `${adjective} ${noun.toLowerCase()} from our ${category} collection. High quality, great value, and built to last. Sample product #${globalIndex} generated for demo/visual purposes.`,
      price,
      cutPrice,
      ratings: randomRating(),
      image: [
        {
          public_id: `seed_products/product_${globalIndex}`,
          url: getImageUrl(noun, globalIndex),
        },
      ],
      category,
      stock: randomInt(0, 200),
      numOfReviews: 0,
      reviews: [],
      user: adminUserId,
    });
  }
  return products;
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('MongoDB connected for seeding...');

    // Find an existing user to attach products to, or create a demo admin.
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (!adminUser) {
      adminUser = await User.create({
        name: 'Ajay Admin',
        email: ADMIN_EMAIL,
        password: 'Admin@1234', // change this after first login
        avatar: {
          public_id: 'avatars/default_admin',
          url: 'https://picsum.photos/seed/adminavatar/200/200',
        },
        role: 'admin',
      });
      console.log(`Created demo admin user: ${ADMIN_EMAIL} / password: Admin@1234 (please change after logging in)`);
    } else {
      console.log(`Using existing user for product ownership: ${ADMIN_EMAIL}`);
    }

    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`Removing ${existingCount} existing product(s) before reseeding...`);
      await Product.deleteMany();
    }

    const totalToInsert = categories.length * PRODUCTS_PER_CATEGORY;
    console.log(`Seeding ${totalToInsert} products (${PRODUCTS_PER_CATEGORY} per category across ${categories.length} categories)...`);
    console.log('This may take a few minutes depending on your connection to MongoDB.');

    let inserted = 0;
    let globalIndex = 1;

    for (const category of categories) {
      const categoryProducts = generateProductsForCategory(category, adminUser._id, globalIndex);
      globalIndex += PRODUCTS_PER_CATEGORY;

      for (let i = 0; i < categoryProducts.length; i += BATCH_SIZE) {
        const batch = categoryProducts.slice(i, i + BATCH_SIZE);
        await Product.insertMany(batch);
        inserted += batch.length;
        console.log(`Inserted ${inserted}/${totalToInsert} products (${category})...`);
      }
    }

    console.log(`Successfully seeded ${inserted} products across ${categories.length} categories.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
