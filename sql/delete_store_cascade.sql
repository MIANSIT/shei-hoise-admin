-- Run this once in Supabase Studio → SQL Editor (or via psql) against the
-- project database. It creates delete_store_cascade(uuid), a function that
-- atomically deletes a store and everything that references it across the
-- full schema (products, orders, vendors, carts, subscriptions, dashboard
-- rollups, etc.), plus any store-scoped users (users.store_id = the store)
-- that don't own another remaining store.
--
-- It returns the ids of any `users` rows it fully deleted, so the caller
-- (src/lib/queries/onboarding/store/deleteStore.ts) can also remove their
-- Supabase Auth identities via the Admin API.
--
-- Re-running this script is safe — CREATE OR REPLACE overwrites the
-- previous definition.

CREATE OR REPLACE FUNCTION delete_store_cascade(p_store_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_user_ids uuid[];
BEGIN
  -- Snapshot every id scoped to this store before anything is deleted, so
  -- later steps can filter on them even after their parent rows are gone.
  CREATE TEMP TABLE _store_products ON COMMIT DROP AS
    SELECT id FROM products WHERE store_id = p_store_id;
  CREATE TEMP TABLE _store_variants ON COMMIT DROP AS
    SELECT pv.id FROM product_variants pv
    WHERE pv.product_id IN (SELECT id FROM _store_products);
  CREATE TEMP TABLE _store_vendors ON COMMIT DROP AS
    SELECT id FROM vendors WHERE store_id = p_store_id;
  CREATE TEMP TABLE _store_vendor_settlements ON COMMIT DROP AS
    SELECT id FROM vendor_settlements WHERE store_id = p_store_id;
  CREATE TEMP TABLE _store_vendor_orders ON COMMIT DROP AS
    SELECT id FROM vendor_orders WHERE store_id = p_store_id;
  CREATE TEMP TABLE _store_orders ON COMMIT DROP AS
    SELECT id FROM orders WHERE store_id = p_store_id;
  CREATE TEMP TABLE _store_carts ON COMMIT DROP AS
    SELECT id FROM carts WHERE store_id = p_store_id;
  CREATE TEMP TABLE _store_users ON COMMIT DROP AS
    SELECT id FROM users WHERE store_id = p_store_id;
  CREATE TEMP TABLE _store_pathao_creds ON COMMIT DROP AS
    SELECT id FROM store_pathao_credentials WHERE store_id = p_store_id;

  -- ── Leaf-level rows (reference products/variants/orders/vendors/etc.) ──
  DELETE FROM bundle_items
    WHERE bundle_product_id IN (SELECT id FROM _store_products)
       OR component_product_id IN (SELECT id FROM _store_products)
       OR component_variant_id IN (SELECT id FROM _store_variants);

  DELETE FROM wishlists
    WHERE user_id IN (SELECT id FROM _store_users)
       OR product_id IN (SELECT id FROM _store_products)
       OR variant_id IN (SELECT id FROM _store_variants);

  DELETE FROM cart_items
    WHERE cart_id IN (SELECT id FROM _store_carts)
       OR product_id IN (SELECT id FROM _store_products)
       OR variant_id IN (SELECT id FROM _store_variants);

  DELETE FROM vendor_stock_movements
    WHERE vendor_id IN (SELECT id FROM _store_vendors)
       OR product_id IN (SELECT id FROM _store_products)
       OR variant_id IN (SELECT id FROM _store_variants)
       OR created_by IN (SELECT id FROM _store_users);

  DELETE FROM vendor_stock
    WHERE vendor_id IN (SELECT id FROM _store_vendors)
       OR product_id IN (SELECT id FROM _store_products)
       OR variant_id IN (SELECT id FROM _store_variants);

  DELETE FROM vendor_settlement_items
    WHERE settlement_id IN (SELECT id FROM _store_vendor_settlements)
       OR product_id IN (SELECT id FROM _store_products)
       OR variant_id IN (SELECT id FROM _store_variants);

  DELETE FROM product_images
    WHERE product_id IN (SELECT id FROM _store_products)
       OR variant_id IN (SELECT id FROM _store_variants);

  DELETE FROM product_inventory
    WHERE product_id IN (SELECT id FROM _store_products)
       OR variant_id IN (SELECT id FROM _store_variants);

  DELETE FROM stock_movements
    WHERE product_id IN (SELECT id FROM _store_products)
       OR variant_id IN (SELECT id FROM _store_variants)
       OR created_by IN (SELECT id FROM _store_users);

  DELETE FROM order_items
    WHERE order_id IN (SELECT id FROM _store_orders)
       OR product_id IN (SELECT id FROM _store_products)
       OR variant_id IN (SELECT id FROM _store_variants);

  DELETE FROM order_tracking
    WHERE order_id IN (SELECT id FROM _store_orders)
       OR updated_by IN (SELECT id FROM _store_users);

  DELETE FROM courier_tracking WHERE store_id = p_store_id;
  DELETE FROM store_reviews WHERE store_id = p_store_id;

  DELETE FROM product_reviews
    WHERE product_id IN (SELECT id FROM _store_products)
       OR customer_id IN (SELECT id FROM _store_users)
       OR order_id IN (SELECT id FROM _store_orders);

  DELETE FROM vendor_order_items
    WHERE vendor_order_id IN (SELECT id FROM _store_vendor_orders)
       OR product_id IN (SELECT id FROM _store_products)
       OR variant_id IN (SELECT id FROM _store_variants);

  DELETE FROM vendor_payments WHERE store_id = p_store_id;

  DELETE FROM pathao_webhook_debug_log
    WHERE credential_id IN (SELECT id FROM _store_pathao_creds);

  DELETE FROM password_reset_tokens
    WHERE user_id IN (SELECT id FROM _store_users);

  -- ── Mid-level rows (now safe: their children above are gone) ──
  DELETE FROM product_variants WHERE id IN (SELECT id FROM _store_variants);
  DELETE FROM vendor_settlements WHERE store_id = p_store_id;
  DELETE FROM vendor_orders WHERE store_id = p_store_id;
  DELETE FROM orders WHERE store_id = p_store_id;
  DELETE FROM carts WHERE store_id = p_store_id;
  DELETE FROM products WHERE store_id = p_store_id;
  DELETE FROM vendors WHERE store_id = p_store_id;
  DELETE FROM categories WHERE store_id = p_store_id;
  DELETE FROM store_pathao_credentials WHERE store_id = p_store_id;
  DELETE FROM store_courier_credentials WHERE store_id = p_store_id;
  DELETE FROM expenses WHERE store_id = p_store_id;
  DELETE FROM expense_categories WHERE store_id = p_store_id;
  DELETE FROM dashboard_customer_summary WHERE store_id = p_store_id;
  DELETE FROM dashboard_daily_product_summary WHERE store_id = p_store_id;
  DELETE FROM dashboard_inventory_summary WHERE store_id = p_store_id;
  DELETE FROM dashboard_daily_expense_category_summary WHERE store_id = p_store_id;
  DELETE FROM dashboard_daily_metrics WHERE store_id = p_store_id;
  DELETE FROM customer_risk_store_touches WHERE store_id = p_store_id;
  DELETE FROM pixel_events WHERE store_id = p_store_id;
  DELETE FROM store_customer_links WHERE store_id = p_store_id;
  DELETE FROM subscription_invoices WHERE store_id = p_store_id;
  DELETE FROM store_subscriptions WHERE store_id = p_store_id;
  DELETE FROM store_settings WHERE store_id = p_store_id;
  DELETE FROM store_social_media WHERE store_id = p_store_id;

  -- Break the users.store_id -> stores.id link before the store row itself
  -- goes away (this is just a "primary store" pointer, not ownership).
  UPDATE users SET store_id = NULL WHERE store_id = p_store_id;

  -- Nothing references stores.id anymore — safe to delete the store.
  DELETE FROM stores WHERE id = p_store_id;

  -- Any user who was scoped to this store (store_id) and does NOT own a
  -- remaining store gets fully removed (profile + account row). Their
  -- Supabase Auth identity is removed afterwards by the caller.
  SELECT array_agg(id) INTO v_deleted_user_ids
    FROM _store_users
    WHERE id NOT IN (SELECT owner_id FROM stores WHERE owner_id IS NOT NULL);

  DELETE FROM user_profiles WHERE user_id = ANY(v_deleted_user_ids);
  DELETE FROM users WHERE id = ANY(v_deleted_user_ids);

  RETURN COALESCE(v_deleted_user_ids, ARRAY[]::uuid[]);
END;
$$;
