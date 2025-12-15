const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const User = require('../src/models/User');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create categories
    const categories = await Category.insertMany([
      {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        slug: 'electronics',
        isActive: true
      },
      {
        name: 'Laptops & Computers',
        description: 'Laptops, desktops, and computer accessories',
        slug: 'laptops-computers',
        isActive: true
      },
      {
        name: 'Smartphones',
        description: 'Mobile phones and accessories',
        slug: 'smartphones',
        isActive: true
      },
      {
        name: 'Headphones & Audio',
        description: 'Headphones, speakers, and audio equipment',
        slug: 'headphones-audio',
        isActive: true
      },
      {
        name: 'Cameras',
        description: 'Digital cameras and photography equipment',
        slug: 'cameras',
        isActive: true
      },
      {
        name: 'Wearables',
        description: 'Smartwatches, fitness trackers, and wearable devices',
        slug: 'wearables',
        isActive: true
      }
    ]);

    console.log('Categories created:', categories.length);

    // Create products with real e-commerce data
    const products = await Product.insertMany([
      {
        name: 'MacBook Pro 16" M3 Max',
        description: 'Powerful laptop with M3 Max chip, 16GB RAM, 512GB SSD. Perfect for professionals and developers.',
        price: 2499.99,
        originalPrice: 2999.99,
        category: categories[1]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop',
            alt: 'MacBook Pro'
          }
        ],
        stock: 25,
        rating: 4.8,
        reviews: [
          {
            userId: null,
            rating: 5,
            comment: 'Excellent performance and build quality',
            createdAt: new Date()
          }
        ],
        sku: 'MBPRO-16-M3',
        tags: ['laptop', 'apple', 'professional'],
        viewCount: 1250,
        isActive: true
      },
      {
        name: 'Dell XPS 15 Laptop',
        description: 'High-performance laptop with Intel i7, RTX 4060, 16GB RAM, 512GB SSD. Great for gaming and work.',
        price: 1799.99,
        originalPrice: 2099.99,
        category: categories[1]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1588872657840-790ff3bde08c?w=500&h=500&fit=crop',
            alt: 'Dell XPS 15'
          }
        ],
        stock: 30,
        rating: 4.6,
        reviews: [],
        sku: 'DELL-XPS-15',
        tags: ['laptop', 'dell', 'gaming'],
        viewCount: 980,
        isActive: true
      },
      {
        name: 'iPhone 15 Pro Max',
        description: 'Latest iPhone with A17 Pro chip, 48MP camera, titanium design. 256GB storage.',
        price: 1199.99,
        originalPrice: 1299.99,
        category: categories[2]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&h=500&fit=crop',
            alt: 'iPhone 15 Pro Max'
          }
        ],
        stock: 50,
        rating: 4.9,
        reviews: [],
        sku: 'IPHONE-15PM-256',
        tags: ['smartphone', 'apple', 'latest'],
        viewCount: 2100,
        isActive: true
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Premium Android flagship with Snapdragon 8 Gen 3, 200MP camera, 12GB RAM.',
        price: 1299.99,
        originalPrice: 1399.99,
        category: categories[2]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&h=500&fit=crop',
            alt: 'Samsung Galaxy S24'
          }
        ],
        stock: 40,
        rating: 4.7,
        reviews: [],
        sku: 'SAMSUNG-S24U',
        tags: ['smartphone', 'samsung', 'flagship'],
        viewCount: 1850,
        isActive: true
      },
      {
        name: 'Sony WH-1000XM5 Headphones',
        description: 'Premium noise-canceling headphones with 30-hour battery life and superior sound quality.',
        price: 399.99,
        originalPrice: 449.99,
        category: categories[3]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
            alt: 'Sony WH-1000XM5'
          }
        ],
        stock: 60,
        rating: 4.8,
        reviews: [],
        sku: 'SONY-WH1000XM5',
        tags: ['headphones', 'audio', 'noise-canceling'],
        viewCount: 1450,
        isActive: true
      },
      {
        name: 'Apple AirPods Pro',
        description: 'Wireless earbuds with active noise cancellation, spatial audio, and seamless Apple integration.',
        price: 249.99,
        originalPrice: 299.99,
        category: categories[3]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1606841837239-c5a1a8a07af7?w=500&h=500&fit=crop',
            alt: 'Apple AirPods Pro'
          }
        ],
        stock: 80,
        rating: 4.7,
        reviews: [],
        sku: 'AIRPODS-PRO-2',
        tags: ['earbuds', 'audio', 'apple'],
        viewCount: 2300,
        isActive: true
      },
      {
        name: 'Canon EOS R6 Camera',
        description: 'Professional mirrorless camera with 20MP full-frame sensor, 4K video, and advanced autofocus.',
        price: 2499.99,
        originalPrice: 2799.99,
        category: categories[4]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500&h=500&fit=crop',
            alt: 'Canon EOS R6'
          }
        ],
        stock: 15,
        rating: 4.9,
        reviews: [],
        sku: 'CANON-EOSR6',
        tags: ['camera', 'professional', 'mirrorless'],
        viewCount: 650,
        isActive: true
      },
      {
        name: 'Apple Watch Series 9',
        description: 'Smartwatch with fitness tracking, heart rate monitor, ECG, and always-on display.',
        price: 399.99,
        originalPrice: 429.99,
        category: categories[5]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
            alt: 'Apple Watch Series 9'
          }
        ],
        stock: 70,
        rating: 4.6,
        reviews: [],
        sku: 'AWATCH-S9-45',
        tags: ['smartwatch', 'wearable', 'fitness'],
        viewCount: 1200,
        isActive: true
      },
      {
        name: 'Samsung Galaxy Buds2 Pro',
        description: 'Premium wireless earbuds with ANC, IPX7 water resistance, and 5-hour battery life.',
        price: 229.99,
        originalPrice: 279.99,
        category: categories[3]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop',
            alt: 'Samsung Galaxy Buds2 Pro'
          }
        ],
        stock: 90,
        rating: 4.5,
        reviews: [],
        sku: 'SAMSUNG-BUDS2P',
        tags: ['earbuds', 'audio', 'samsung'],
        viewCount: 1100,
        isActive: true
      },
      {
        name: 'iPad Pro 12.9" M2',
        description: 'Powerful tablet with M2 chip, ProMotion display, and Apple Pencil support. 256GB storage.',
        price: 1099.99,
        originalPrice: 1199.99,
        category: categories[1]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=500&fit=crop',
            alt: 'iPad Pro'
          }
        ],
        stock: 35,
        rating: 4.8,
        reviews: [],
        sku: 'IPAD-PRO-129-M2',
        tags: ['tablet', 'apple', 'professional'],
        viewCount: 950,
        isActive: true
      },
      {
        name: 'Google Pixel 8 Pro',
        description: 'AI-powered smartphone with advanced camera, Tensor G3 chip, and pure Android experience.',
        price: 999.99,
        originalPrice: 1099.99,
        category: categories[2]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
            alt: 'Google Pixel 8 Pro'
          }
        ],
        stock: 45,
        rating: 4.7,
        reviews: [],
        sku: 'PIXEL-8PRO-256',
        tags: ['smartphone', 'google', 'ai'],
        viewCount: 1650,
        isActive: true
      },
      {
        name: 'Bose QuietComfort 45',
        description: 'Noise-canceling headphones with 24-hour battery, premium sound, and comfort design.',
        price: 379.99,
        originalPrice: 429.99,
        category: categories[3]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500&h=500&fit=crop',
            alt: 'Bose QuietComfort 45'
          }
        ],
        stock: 55,
        rating: 4.6,
        reviews: [],
        sku: 'BOSE-QC45',
        tags: ['headphones', 'audio', 'noise-canceling'],
        viewCount: 1300,
        isActive: true
      },
      {
        name: 'Microsoft Surface Laptop 6',
        description: 'Ultra-thin laptop with Snapdragon X Plus, 16GB RAM, 512GB SSD. Great for productivity.',
        price: 1299.99,
        originalPrice: 1499.99,
        category: categories[1]._id,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1588872657840-790ff3bde08c?w=500&h=500&fit=crop',
            alt: 'Microsoft Surface Laptop'
          }
        ],
        stock: 28,
        rating: 4.5,
        reviews: [],
        sku: 'SURFACE-LT6',
        tags: ['laptop', 'microsoft', 'productivity'],
        viewCount: 820,
        isActive: true
      }
    ]);

    console.log('Products created:', products.length);

    // Create a test admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    if (!adminUser) {
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'admin123456',
        role: 'admin',
        phone: '+1234567890',
        address: {
          street: '123 Admin St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      });
      console.log('Admin user created');
    }

    // Create a test regular user
    const regularUser = await User.findOne({ email: 'user@example.com' });
    if (!regularUser) {
      await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'user123456',
        role: 'user',
        phone: '+1234567891',
        address: {
          street: '456 User Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA'
        }
      });
      console.log('Regular user created');
    }

    console.log('✅ Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Admin: admin@example.com / admin123456');
    console.log('User: user@example.com / user123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
