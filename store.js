(() => {
  const cfg = window.NB_TEX_CONFIG || {};
  document.getElementById("year").textContent = new Date().getFullYear();
  const list = document.getElementById("product-list");
  const empty = document.getElementById("empty-message");
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY || !window.supabase) {
    list.innerHTML = '<p class="notice">Website setup is incomplete. Please contact the store administrator.</p>';
    return;
  }
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
  const money = n => "₦" + Number(n || 0).toLocaleString("en-NG");
  async function load() {
    const { data, error } = await client.from("products")
      .select("id,name,description,price,image_url,active,created_at")
      .eq("active", true).order("created_at", { ascending: false });
    if (error) {
      list.innerHTML = '<p class="notice">An error occurred while loading products. Please try again later.</p>';
      return;
    }
    list.innerHTML = "";
    if (!data || data.length === 0) { empty.hidden = false; return; }
    empty.hidden = true;
    data.forEach(p => {
      const card = document.createElement("article");
      card.className = "product-card";
      const image = p.image_url ? `<img src="${escapeAttr(p.image_url)}" alt="">` : '<div class="image-placeholder">NB TEX</div>';
      const msg = encodeURIComponent(`Hello NB TEX Online, I want to order: ${p.name} (${money(p.price)}).`);
      card.innerHTML = `${image}<div class="product-info"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description || "")}</p><strong>${money(p.price)}</strong><a class="gold-button" target="_blank" rel="noopener" href="https://wa.me/${cfg.WHATSAPP_NUMBER || "2348165447439"}?text=${msg}">Order on WhatsApp</a></div>`;
      list.appendChild(card);
    });
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s) { return escapeHtml(s); }
  load();
})();