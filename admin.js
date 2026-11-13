(() => {
  const cfg = window.NB_TEX_CONFIG || {};
  const $ = id => document.getElementById(id);
  const setupError = $("setup-error");
  const loginPanel = $("login-panel");
  const dashboard = $("dashboard");
  const loginMessage = $("login-message");
  const adminMessage = $("admin-message");
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY || !window.supabase) {
    setupError.hidden = false;
    return;
  }
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
  const money = n => "₦" + Number(n || 0).toLocaleString("en-NG");
  $("login-form").addEventListener("submit", async e => {
    e.preventDefault();
    loginMessage.textContent = "Signing in...";
    const { error } = await client.auth.signInWithPassword({ email: $("email").value.trim(), password: $("password").value });
    if (error) { loginMessage.textContent = error.message; return; }
    loginMessage.textContent = "";
    await showDashboard();
  });
  $("logout").addEventListener("click", async () => { await client.auth.signOut(); dashboard.hidden = true; loginPanel.hidden = false; });
  $("cancel-edit").addEventListener("click", resetForm);
  $("product-form").addEventListener("submit", saveProduct);
  async function showDashboard() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) return;
    loginPanel.hidden = true; dashboard.hidden = false;
    await loadProducts();
  }
  async function loadProducts() {
    const holder = $("admin-products");
    holder.textContent = "Loading...";
    const { data, error } = await client.from("products").select("*").order("created_at", { ascending: false });
    if (error) { holder.textContent = error.message; return; }
    holder.innerHTML = "";
    (data || []).forEach(p => {
      const item = document.createElement("div");
      item.className = "admin-product";
      const title = document.createElement("strong"); title.textContent = p.name;
      const price = document.createElement("span"); price.textContent = money(p.price);
      const edit = document.createElement("button"); edit.className = "outline-button"; edit.textContent = "Edit";
      edit.addEventListener("click", () => {
        $("product-id").value = p.id; $("product-name").value = p.name;
        $("product-price").value = p.price; $("product-description").value = p.description || "";
        adminMessage.textContent = "Editing " + p.name;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      const toggle = document.createElement("button"); toggle.className = "outline-button"; toggle.textContent = p.active ? "Hide" : "Show";
      toggle.addEventListener("click", async () => {
        const { error } = await client.from("products").update({ active: !p.active }).eq("id", p.id);
        adminMessage.textContent = error ? error.message : "Product updated.";
        loadProducts();
      });
      const del = document.createElement("button"); del.className = "danger-button"; del.textContent = "Delete";
      del.addEventListener("click", async () => {
        if (!confirm("Delete this product?")) return;
        const { error } = await client.from("products").delete().eq("id", p.id);
        adminMessage.textContent = error ? error.message : "Product deleted.";
        loadProducts();
      });
      item.append(title, price, edit, toggle, del); holder.appendChild(item);
    });
  }
  async function saveProduct(e) {
    e.preventDefault();
    adminMessage.textContent = "Saving...";
    const id = $("product-id").value;
    const payload = { name: $("product-name").value.trim(), price: Number($("product-price").value), description: $("product-description").value.trim(), active: true };
    const file = $("product-image").files[0];
    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${Date.now()}-${safeName}`;
      const { error: uploadError } = await client.storage.from("product-images").upload(path, file, { upsert: true });
      if (uploadError) { adminMessage.textContent = uploadError.message; return; }
      const { data } = client.storage.from("product-images").getPublicUrl(path);
      payload.image_url = data.publicUrl;
    }
    const result = id
      ? await client.from("products").update(payload).eq("id", id)
      : await client.from("products").insert(payload);
    if (result.error) { adminMessage.textContent = result.error.message; return; }
    adminMessage.textContent = "Product saved.";
    resetForm(); await loadProducts();
  }
  function resetForm() { $("product-form").reset(); $("product-id").value = ""; }
  showDashboard();
})();