/* Saratoga Horse Rx: same system as the clinic page, its own small behaviour layer. */
(function () {
"use strict";
var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var M = window.MEDIA || {};

/* the pharmacy has no photography of its own yet, so it borrows the practice's
   Its own shelves, benches and labels are the shot list. */
var STILLS = {
  "rx-hero":     { keys: ["stalls", "handsOn"], spec: "PHARMACY · the shelves, the bench, a label going on" },
  "rx-compound": { keys: ["exam", "theatre"],   spec: "COMPOUNDING · hands at the bench, a syringe being filled" }
};
function kb(host, rec) {
  var src = null;
  try { src = M.stillsFor ? M.stillsFor(rec.keys) : null; } catch (e) { src = null; }
  if (!src && M.practice && M.practice.srcs) src = M.practice.srcs.slice(0, 2);
  if (!src || !src.length) {
    host.innerHTML = '<div class="placeholder mono"><b>Slot open</b><span>' + rec.spec + "</span></div>";
    return;
  }
  var w = document.createElement("div");
  w.className = "kb";
  src.forEach(function (s, i) {
    var im = document.createElement("img");
    im.src = s; im.alt = ""; im.loading = i ? "lazy" : "eager"; im.decoding = "async";
    if (i % 2) im.classList.add("alt");
    if (i === 0) im.classList.add("on");
    w.appendChild(im);
  });
  if (src.length > 1 && !RM) {
    var i = 0, imgs = w.children;
    setInterval(function () {
      if (document.hidden) return;
      imgs[i].classList.remove("on");
      i = (i + 1) % imgs.length;
      imgs[i].classList.add("on");
    }, 6200);
  }
  host.appendChild(w);
  var t = document.createElement("span");
  t.className = "comp-tag mono";
  t.textContent = "Clinic photo";
  t.title = "Borrowed from the clinic. The pharmacy's own shot list is in ASSETS.md";
  host.appendChild(t);
}

var CATS = [
  ["Prescription medicines", "Antibiotics, anti-inflammatories, sedatives and gastric protectants, against a current prescription.", "Rx"],
  ["Compounded formulations", "Made to the strength, form and flavour your horse will take. One prescription, one patient.", "Rx"],
  ["Joint therapies", "Intra-articular and systemic, the ones this practice actually reaches for.", "Rx"],
  ["Vaccines &amp; biologics", "Cold chain from our refrigerator to yours, or given on the visit.", "Rx"],
  ["Dewormers &amp; faecal testing", "Planned on egg counts, not on a calendar.", "Over the counter"],
  ["Wound care &amp; bandaging", "Everything the kit runs out of at nine on a Sunday evening.", "Over the counter"],
  ["Supplements &amp; feed-through", "Only what the veterinarians here would put on their own horses.", "Over the counter"],
  ["Barn supplies", "Syringes, needles, thermometers, poultice.", "Over the counter"]
];
function boot() {
  var cat = document.getElementById("cat");
  if (cat) {
    cat.innerHTML = CATS.map(function (c, i) {
      var need = c[2] === "Rx";
      return '<div class="cat-row"><span class="i">' + String(i + 1).padStart(2, "0") + "</span>" +
        "<h3>" + c[0] + "</h3><p>" + c[1] + "</p>" +
        '<span class="rx' + (need ? " need" : "") + '">' + (need ? "Prescription" : "Over the counter") + "</span></div>";
    }).join("");
  }
  Object.keys(STILLS).forEach(function (k) {
    var host = document.querySelector('[data-stills="' + k + '"]');
    if (host) kb(host, STILLS[k]);
  });

  var nav = document.getElementById("nav");
  window.addEventListener("scroll", function () { nav.classList.toggle("stuck", window.scrollY > 10); }, { passive: true });
  var burger = document.getElementById("burger"), links = document.getElementById("navlinks");
  burger.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.textContent = open ? "Close" : "Menu";
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { links.classList.remove("open"); burger.textContent = "Menu"; }
  });

  var clock = document.getElementById("clock");
  function tick() {
    try {
      var f = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", timeZoneName: "short", hour12: false });
      clock.textContent = "Saratoga Springs \u00b7 " + f.format(new Date());
    } catch (e) { clock.textContent = "Saratoga Springs, NY"; }
  }
  tick(); setInterval(tick, 30000);

  var form = document.getElementById("rxForm"), sent = document.getElementById("rxSent");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = document.getElementById("rname"), p = document.getElementById("rphone");
    if (!n.value.trim()) { n.focus(); n.style.borderColor = "#C2571F"; return; }
    if (!p.value.trim()) { p.focus(); p.style.borderColor = "#C2571F"; return; }
    var esc = function (s) { return s.replace(/[<>&"]/g, ""); };
    sent.innerHTML = "<b>Thank you, " + esc(n.value.trim().split(" ")[0]) + ".</b><br>We will open the file for " +
      (esc(document.getElementById("rhorse").value.trim()) || "your horse") +
      " and call you on " + esc(p.value.trim()) + ". Nothing is dispensed until your veterinarian authorizes it." +
      "<br><br>Once this form is wired to the pharmacy inbox, it arrives with the horse's record attached.";
    sent.hidden = false; form.hidden = true;
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
})();
