/* DentX International — çerez onayı (GA4 / Google tag, Consent Mode v2 "basic") + dönüşüm olayları */
(function () {
  var GTM = "GTM-K8886ZM8", KEY = "dx-consent", YEAR = 31536e6;
  var T = window.__CK || {};
  var lang = (document.documentElement.lang || "en").slice(0, 2);
  function get() { try { var c = JSON.parse(localStorage.getItem(KEY) || "null"); return c && Date.now() - c.t < YEAR && (!T.px || c.v >= 2) ? c : null; } catch (e) { return null; } }
  function set(a) { try { localStorage.setItem(KEY, JSON.stringify({ a: a, t: Date.now(), v: T.px ? 2 : 1 })); } catch (e) {} }
  function load() { if (window.__dxBoot) window.__dxBoot(); }
  var FB = { generate_lead: "Lead", whatsapp_click: "Contact", phone_click: "Contact", book_slot_click: "Schedule" };
  function ev(name, p) {
    if (!window.__dxOK) return; p = p || {}; p.page_lang = lang; p.page_path = location.pathname; gtag("event", name, p);
    if (window.fbq && FB[name]) { try { fbq("track", FB[name], p.city ? { content_name: p.city } : {}); } catch (e) {} }
  }
  window.dxTrack = ev;

  // banner
  var box;
  function show() {
    if (box) { box.hidden = false; box.querySelector(".ck-a").focus(); return; }
    box = document.createElement("div"); box.className = "ck"; box.setAttribute("role", "dialog"); box.setAttribute("aria-live", "polite"); box.setAttribute("aria-label", T.title || "Cookies");
    var pre = lang === "en" ? "" : "/" + lang;
    box.innerHTML = '<p class="ck-t"><b>' + (T.title || "Cookies") + '</b> ' + (T.text || "") + ' <a href="' + (T.href || pre + "/cookie-policy") + '">' + (T.policy || "Cookie policy") + '</a></p>' +
      '<div class="ck-b"><button type="button" class="ck-r">' + (T.reject || "Reject") + '</button><button type="button" class="ck-a">' + (T.accept || "Accept") + '</button></div>';
    document.body.appendChild(box);
    box.querySelector(".ck-a").onclick = function () { set(1); box.hidden = true; load(); };
    box.querySelector(".ck-r").onclick = function () {
      var was = get(); set(0); box.hidden = true;
      if (was && was.a === 1) { gtag("consent", "update", { analytics_storage: "denied" }); if (window.fbq) { try { fbq("consent", "revoke"); } catch (e) {} } window.__dxOK = 0; }
    };
  }
  document.addEventListener("click", function (e) {
    var o = e.target.closest && e.target.closest("[data-ck-open]");
    if (o) { e.preventDefault(); show(); return; }
    var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
    var h = a.getAttribute("href") || "";
    if (/wa\.me|wa\.link|whatsapp\.com/.test(h)) {
      var city = a.getAttribute("data-city");
      ev(city ? "book_slot_click" : "whatsapp_click", city ? { city: city } : { link_location: a.closest("footer") ? "footer" : a.closest("header,.mobile-menu") ? "menu" : "page" });
    } else if (/^tel:/.test(h)) ev("phone_click", { phone: h.slice(4) });
    else if (/calendly\.com/.test(h)) ev("video_call_click");
  }, true);
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".dxm-b")) ev("meet_bubble_open"); });
  // form gönderimi → generate_lead
  if (window.fetch) {
    var f = window.fetch;
    window.fetch = function (u, o) {
      var p = f.apply(this, arguments);
      try {
        if (String(u).indexOf("/api/lead") > -1 && o && o.method === "POST") {
          p.then(function (r) { return r.clone().json(); }).then(function (j) { if (j && j.ok) ev("generate_lead", { form_location: "consultation_form" }); }).catch(function () {});
        }
      } catch (x) {}
      return p;
    };
  }
  function init() { var c = get(); if (!c) show(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
