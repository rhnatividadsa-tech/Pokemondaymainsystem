import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Create Supabase client
const getSupabase = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-a65c9262/health", (c) => {
  return c.json({ status: "ok" });
});

// =====================================================
// PLAYER ENDPOINTS
// =====================================================

// Get player by name (case-insensitive)
app.get("/make-server-a65c9262/players/:name", async (c) => {
  try {
    const name = c.req.param("name");
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("players")
      .select("*")
      .ilike("name", name)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.log("Error fetching player:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ player: data });
  } catch (err) {
    console.log("Error in GET /players/:name:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// Create or get player
app.post("/make-server-a65c9262/players", async (c) => {
  try {
    const { name } = await c.req.json();
    const supabase = getSupabase();

    // Check if player exists
    const { data: existing } = await supabase
      .from("players")
      .select("*")
      .ilike("name", name)
      .single();

    if (existing) {
      return c.json({ player: existing, isNew: false });
    }

    // Create new player
    const { data, error } = await supabase
      .from("players")
      .insert({ name, coins: 0 })
      .select()
      .single();

    if (error) {
      console.log("Error creating player:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ player: data, isNew: true });
  } catch (err) {
    console.log("Error in POST /players:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// Update player
app.put("/make-server-a65c9262/players/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("players")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.log("Error updating player:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ player: data });
  } catch (err) {
    console.log("Error in PUT /players/:id:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// =====================================================
// OWNED POKEMON ENDPOINTS
// =====================================================

// Get all Pokemon for a player
app.get("/make-server-a65c9262/pokemon/player/:playerId", async (c) => {
  try {
    const playerId = c.req.param("playerId");
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("owned_pokemon")
      .select("*")
      .eq("player_id", playerId)
      .order("caught_at", { ascending: false });

    if (error) {
      console.log("Error fetching Pokemon:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ pokemon: data });
  } catch (err) {
    console.log("Error in GET /pokemon/player/:playerId:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// Add Pokemon to player
app.post("/make-server-a65c9262/pokemon", async (c) => {
  try {
    const { player_id, pokemon_data_id, level, source } = await c.req.json();
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("owned_pokemon")
      .insert({
        player_id,
        pokemon_data_id,
        level: level || 5,
        source,
        status: "Active"
      })
      .select()
      .single();

    if (error) {
      console.log("Error adding Pokemon:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ pokemon: data });
  } catch (err) {
    console.log("Error in POST /pokemon:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// Update Pokemon (level up or evolve)
app.put("/make-server-a65c9262/pokemon/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("owned_pokemon")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.log("Error updating Pokemon:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ pokemon: data });
  } catch (err) {
    console.log("Error in PUT /pokemon/:id:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// =====================================================
// INVENTORY ENDPOINTS
// =====================================================

// Get inventory for player
app.get("/make-server-a65c9262/inventory/:playerId", async (c) => {
  try {
    const playerId = c.req.param("playerId");
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("player_id", playerId)
      .gt("quantity", 0);

    if (error) {
      console.log("Error fetching inventory:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ items: data });
  } catch (err) {
    console.log("Error in GET /inventory/:playerId:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// Add or update inventory item
app.post("/make-server-a65c9262/inventory", async (c) => {
  try {
    const { player_id, item_name, quantity_change } = await c.req.json();
    const supabase = getSupabase();

    // Get current quantity
    const { data: existing } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("player_id", player_id)
      .eq("item_name", item_name)
      .single();

    const newQuantity = (existing?.quantity || 0) + quantity_change;

    if (newQuantity <= 0) {
      // Delete if quantity is 0 or less
      await supabase
        .from("inventory_items")
        .delete()
        .eq("player_id", player_id)
        .eq("item_name", item_name);

      return c.json({ item: null });
    }

    // Upsert the item
    const { data, error } = await supabase
      .from("inventory_items")
      .upsert({
        player_id,
        item_name,
        quantity: newQuantity
      }, { onConflict: "player_id,item_name" })
      .select()
      .single();

    if (error) {
      console.log("Error updating inventory:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ item: data });
  } catch (err) {
    console.log("Error in POST /inventory:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// =====================================================
// GAME HISTORY ENDPOINTS
// =====================================================

// Get history for player
app.get("/make-server-a65c9262/history/:playerId", async (c) => {
  try {
    const playerId = c.req.param("playerId");
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("game_history")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Error fetching history:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ history: data });
  } catch (err) {
    console.log("Error in GET /history/:playerId:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// Add history entry
app.post("/make-server-a65c9262/history", async (c) => {
  try {
    const entry = await c.req.json();
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("game_history")
      .insert(entry)
      .select()
      .single();

    if (error) {
      console.log("Error adding history:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ entry: data });
  } catch (err) {
    console.log("Error in POST /history:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// =====================================================
// BULK OPERATIONS
// =====================================================

// Get all data for a player (one call for initial load)
app.get("/make-server-a65c9262/player-data/:playerId", async (c) => {
  try {
    const playerId = c.req.param("playerId");
    const supabase = getSupabase();

    const [playerRes, pokemonRes, inventoryRes, historyRes] = await Promise.all([
      supabase.from("players").select("*").eq("id", playerId).single(),
      supabase.from("owned_pokemon").select("*").eq("player_id", playerId),
      supabase.from("inventory_items").select("*").eq("player_id", playerId).gt("quantity", 0),
      supabase.from("game_history").select("*").eq("player_id", playerId).order("created_at", { ascending: false })
    ]);

    return c.json({
      player: playerRes.data,
      pokemon: pokemonRes.data || [],
      inventory: inventoryRes.data || [],
      history: historyRes.data || []
    });
  } catch (err) {
    console.log("Error in GET /player-data/:playerId:", err);
    return c.json({ error: String(err) }, 500);
  }
});

Deno.serve(app.fetch);