-- ####################################################################
-- ###      AI Figure & Miniature Marketplace - Supabase Schema     ###
-- ####################################################################
-- ### Description: This migration file sets up the initial database  ###
-- ### schema for the MVP based on the provided PRD. It includes    ###
-- ### tables for products, custom orders, marketplace orders,      ###
-- ### user profiles, reviews, Q&A, and more.                       ###
-- ### Author: Gemini                                               ###
-- ### Version: 1.0.0                                               ###
-- ####################################################################


-- ====================================================================
-- 1. EXTENSIONS & TYPE DEFINITIONS
-- ====================================================================
-- Enable pgcrypto for UUID generation if not already enabled.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom ENUM types for status fields to ensure data consistency.
CREATE TYPE public.category_name AS ENUM (
    'Anime',
    'Gaming',
    'Original Character',
    'Diorama',
    'Props',
    'Mecha',
    'Creature'
);

CREATE TYPE public.custom_order_status AS ENUM (
    'pending_review', -- 관리자 검토 대기
    'quote_provided', -- 견적 제공됨
    'payment_pending',-- 결제 대기
    'in_progress',    -- 제작 중
    'completed',      -- 제작 완료
    'shipped',        -- 배송 중
    'delivered',      -- 배송 완료
    'cancelled'       -- 주문 취소
);

CREATE TYPE public.order_status AS ENUM (
    'payment_pending',-- 결제 대기
    'paid',           -- 결제 완료
    'preparing',      -- 배송 준비 중
    'shipped',        -- 배송 중
    'delivered',      -- 배송 완료
    'cancelled',      -- 주문 취소
    'refunded'        -- 환불 완료
);


-- ====================================================================
-- 2. TRIGGER FUNCTION FOR `updated_at`
-- ====================================================================
-- This function and trigger automatically update the `updated_at`
-- timestamp column on any row modification.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ====================================================================
-- 3. TABLE: PROFILES
-- ====================================================================
-- Stores application-specific user data, linked to Clerk users.
-- This table is separate from Clerk's auth.users table.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    shipping_address TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for profiles updated_at
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- ====================================================================
-- 4. TABLE: CATEGORIES
-- ====================================================================
-- Stores product categories for better organization and filtering.
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name public.category_name NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ====================================================================
-- 5. TABLE: PRODUCTS
-- ====================================================================
-- Represents items available for sale in the marketplace.
-- These are typically 재판매(re-sale) items derived from custom orders.
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    -- Base price for 3D printing
    base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
    -- Additional cost for painting
    painting_price NUMERIC(10, 2) NOT NULL CHECK (painting_price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_urls TEXT[] NOT NULL,
    -- 3D model data URL (e.g., to Supabase Storage)
    model_data_url TEXT,
    category_id INT REFERENCES public.categories(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for products updated_at
CREATE TRIGGER on_products_updated
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- ====================================================================
-- 6. TABLE: CUSTOM_ORDERS (주문제작 의뢰)
-- ====================================================================
-- Manages custom figure creation requests from users.
CREATE TABLE public.custom_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE RESTRICT,
    -- User-uploaded 2D image
    source_image_url TEXT NOT NULL,
    -- AI-generated or artist-refined 3D model
    generated_model_url TEXT,
    -- Final product images
    completed_image_urls TEXT[],
    description TEXT NOT NULL,
    size_preference TEXT,
    status public.custom_order_status NOT NULL DEFAULT 'pending_review',
    quoted_price NUMERIC(10, 2),
    final_price NUMERIC(10, 2),
    shipping_address TEXT,
    -- Once completed, this can be converted into a marketplace product.
    linked_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for custom_orders updated_at
CREATE TRIGGER on_custom_orders_updated
    BEFORE UPDATE ON public.custom_orders
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- ====================================================================
-- 7. TABLE: CART_ITEMS (장바구니)
-- ====================================================================
-- Stores items a user has added to their shopping cart for marketplace products.
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    with_painting BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensures a user can't have the same product (with same painting option) twice in their cart.
    UNIQUE(clerk_id, product_id, with_painting)
);


-- ====================================================================
-- 8. TABLE: ORDERS (마켓플레이스 주문)
-- ====================================================================
-- Header table for marketplace product purchases.
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE RESTRICT,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status public.order_status NOT NULL DEFAULT 'payment_pending',
    shipping_address TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    -- Toss Payments Payment Key, etc.
    payment_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for orders updated_at
CREATE TRIGGER on_orders_updated
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- ====================================================================
-- 9. TABLE: ORDER_ITEMS (주문 상세)
-- ====================================================================
-- Line items for each marketplace order.
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_per_item NUMERIC(10, 2) NOT NULL, -- Price at the time of purchase
    with_painting BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(order_id, product_id, with_painting)
);


-- ====================================================================
-- 10. TABLE: REVIEWS (후기)
-- ====================================================================
-- User reviews for purchased marketplace products.
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_item_id UUID UNIQUE REFERENCES public.order_items(id), -- A review can only be written for a purchased item
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    image_urls TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for reviews updated_at
CREATE TRIGGER on_reviews_updated
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- ====================================================================
-- 11. TABLE: QNA (상품 문의)
-- ====================================================================
-- Question and Answer section for marketplace products.
CREATE TABLE public.qna (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    -- Question fields
    questioner_clerk_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    questioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Answer fields (nullable)
    answerer_is_admin BOOLEAN DEFAULT FALSE, -- To distinguish admin answers
    answer TEXT,
    answered_at TIMESTAMPTZ
);


-- ====================================================================
-- 12. INDEXES FOR PERFORMANCE
-- ====================================================================
-- Create indexes on foreign keys and frequently queried columns.
CREATE INDEX idx_profiles_clerk_id ON public.profiles(clerk_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_custom_orders_clerk_id ON public.custom_orders(clerk_id);
CREATE INDEX idx_custom_orders_status ON public.custom_orders(status);
CREATE INDEX idx_cart_items_clerk_id ON public.cart_items(clerk_id);
CREATE INDEX idx_orders_clerk_id ON public.orders(clerk_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_qna_product_id ON public.qna(product_id);


-- ====================================================================
-- 13. DISABLE ROW LEVEL SECURITY (RLS) as per requirements
-- ====================================================================
-- In a real project, you would enable RLS and define policies.
-- For this MVP spec, RLS is explicitly disabled.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.qna DISABLE ROW LEVEL SECURITY;


-- ====================================================================
-- 14. SEED DATA (개발용 샘플 데이터)
-- ====================================================================
-- Insert sample data to populate the database for development.

-- Seed Categories
INSERT INTO public.categories (name, description) VALUES
('Anime', 'Characters from Japanese animation.'),
('Gaming', 'Characters and assets from video games.'),
('Original Character', 'Unique creations by artists and users.'),
('Diorama', 'Miniature scenes and environments.'),
('Props', 'Replicas of items from movies, games, and more.'),
('Mecha', 'Robots and mechanical suits.');

-- Seed Products (20 samples)
INSERT INTO public.products (name, description, price, base_price, painting_price, stock_quantity, image_urls, category_id) VALUES
('Cyberpunk Samurai', 'A futuristic samurai warrior with neon katana. High-detail resin print.', 120.00, 75.00, 45.00, 10, '{"https://example.com/img/cyber_samurai_1.jpg", "https://example.com/img/cyber_samurai_2.jpg"}', (SELECT id FROM categories WHERE name = 'Original Character')),
('Chibi Dragon', 'A cute, small dragon in a playful pose. Perfect for desks.', 45.00, 25.00, 20.00, 30, '{"https://example.com/img/chibi_dragon_1.jpg"}', (SELECT id FROM categories WHERE name = 'Creature')),
('Space Marine Bust', 'A detailed bust of a famous sci-fi space marine.', 80.00, 50.00, 30.00, 15, '{"https://example.com/img/space_marine_1.jpg"}', (SELECT id FROM categories WHERE name = 'Gaming')),
('Forest Spirit', 'A mystical creature of the woods, entwined with vines.', 95.00, 60.00, 35.00, 8, '{"https://example.com/img/forest_spirit_1.jpg"}', (SELECT id FROM categories WHERE name = 'Creature')),
('Anime Witch Apprentice', 'A young witch learning her craft, with a spellbook and cat.', 110.00, 65.00, 45.00, 12, '{"https://example.com/img/anime_witch_1.jpg"}', (SELECT id FROM categories WHERE name = 'Anime')),
('Gundam RX-78 Head', 'A 1:35 scale head of the classic Gundam mobile suit.', 150.00, 100.00, 50.00, 5, '{"https://example.com/img/gundam_head_1.jpg"}', (SELECT id FROM categories WHERE name = 'Mecha')),
('Fantasy Knight', 'A valiant knight in full plate armor, holding a greatsword.', 130.00, 80.00, 50.00, 11, '{"https://example.com/img/fantasy_knight_1.jpg"}', (SELECT id FROM categories WHERE name = 'Original Character')),
('Steampunk Inventor', 'An inventor with goggles, gears, and a quirky robotic arm.', 115.00, 70.00, 45.00, 9, '{"https://example.com/img/steampunk_inventor_1.jpg"}', (SELECT id FROM categories WHERE name = 'Original Character')),
('Doom Slayer Helmet', 'A wearable replica of the iconic helmet from DOOM.', 250.00, 180.00, 70.00, 3, '{"https://example.com/img/doom_helmet_1.jpg"}', (SELECT id FROM categories WHERE name = 'Props')),
('Zelda Master Sword', 'A miniature replica of the Master Sword in its pedestal.', 65.00, 40.00, 25.00, 25, '{"https://example.com/img/master_sword_1.jpg"}', (SELECT id FROM categories WHERE name = 'Props')),
('Cthulhu Idol', 'A mysterious idol depicting the cosmic entity Cthulhu.', 75.00, 50.00, 25.00, 18, '{"https://example.com/img/cthulhu_idol_1.jpg"}', (SELECT id FROM categories WHERE name = 'Creature')),
('Final Fantasy Red Mage', 'A stylish Red Mage character, casting a spell.', 125.00, 75.00, 50.00, 7, '{"https://example.com/img/red_mage_1.jpg"}', (SELECT id FROM categories WHERE name = 'Gaming')),
('My Neighbor Totoro Diorama', 'A lovely diorama of Totoro at the bus stop.', 180.00, 110.00, 70.00, 6, '{"https://example.com/img/totoro_diorama_1.jpg"}', (SELECT id FROM categories WHERE name = 'Diorama')),
('Evangelion Unit-01', 'A dynamic pose of the iconic EVA Unit-01.', 220.00, 150.00, 70.00, 4, '{"https://example.com/img/eva_01_1.jpg"}', (SELECT id FROM categories WHERE name = 'Mecha')),
('Street Fighter Ryu', 'Ryu in his classic Hadoken pose.', 100.00, 60.00, 40.00, 20, '{"https://example.com/img/ryu_1.jpg"}', (SELECT id FROM categories WHERE name = 'Gaming')),
('Sailor Moon Wand', 'A 1:1 replica of Sailor Moon''s Moon Stick.', 90.00, 55.00, 35.00, 13, '{"https://example.com/img/moon_stick_1.jpg"}', (SELECT id FROM categories WHERE name = 'Props')),
('Post-Apocalyptic Survivor', 'A gritty survivor navigating a ruined world.', 105.00, 65.00, 40.00, 10, '{"https://example.com/img/survivor_1.jpg"}', (SELECT id FROM categories WHERE name = 'Original Character')),
('Cyberpunk Alley Diorama', 'A detailed, neon-lit alleyway scene for figures.', 200.00, 140.00, 60.00, 5, '{"https://example.com/img/cyber_alley_1.jpg"}', (SELECT id FROM categories WHERE name = 'Diorama')),
('Naruto Sage Mode', 'Naruto in his powerful Sage Mode.', 135.00, 85.00, 50.00, 9, '{"https://example.com/img/naruto_sage_1.jpg"}', (SELECT id FROM categories WHERE name = 'Anime')),
('Dwarf Blacksmith', 'A stout dwarf forging a weapon at his anvil.', 95.00, 60.00, 35.00, 14, '{"https://example.com/img/dwarf_smith_1.jpg"}', (SELECT id FROM categories WHERE name = 'Original Character'));

-- NOTE: Seeding data for profiles, orders, etc., would require actual
-- clerk_id values. This should be done via a separate seeding script
-- in your application code after users have been created.
-- Example of how you would do it:
/*
-- 1. Create a user in your Clerk development instance, get their ID.
-- 2. Insert a profile for them.
INSERT INTO public.profiles (clerk_id, email, full_name, shipping_address, phone_number) VALUES
('user_2dx...', 'testuser@example.com', 'Test User', '123 Sample St, Seoul, Korea', '010-1234-5678');

-- 3. Create a custom order for that user.
INSERT INTO public.custom_orders (clerk_id, source_image_url, description, size_preference) VALUES
('user_2dx...', 'https://example.com/img/my_cat.jpg', 'My cat, fluffy, sitting down. Please make it cute.', '15cm tall');

-- 4. Create a marketplace order for that user.
WITH new_order AS (
  INSERT INTO public.orders (clerk_id, total_amount, shipping_address, recipient_name, recipient_phone)
  VALUES ('user_2dx...', 120.00, '123 Sample St, Seoul, Korea', 'Test User', '010-1234-5678')
  RETURNING id
)
INSERT INTO public.order_items (order_id, product_id, quantity, price_per_item, with_painting)
SELECT id, (SELECT id FROM products WHERE name = 'Cyberpunk Samurai'), 1, 120.00, true FROM new_order;
*/

-- ####################################################################
-- ###                       END OF MIGRATION                       ###
-- ####################################################################