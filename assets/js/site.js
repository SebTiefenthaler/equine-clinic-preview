/* ============================================================
   Equine Clinic of Saratoga, behaviour
   Scenes run on native sticky + one rAF-throttled scroll read
   instead of ScrollTrigger: same result, ~65 KB less JS (§8).
   ============================================================ */
(function () {
"use strict";
var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var MOBILE = function () { return window.innerWidth <= 900; };
var M = window.MEDIA || {};
var players = [];
var LENIS = null;

/* one scroll authority: Lenis owns the scroll position when it is running */
function scrollToY(y) {
  y = Math.max(0, Math.round(y));
  if (LENIS) { LENIS.scrollTo(y, { duration: RM ? 0 : 1.1 }); return; }
  window.scrollTo({ top: y, behavior: RM ? "auto" : "smooth" });
}
/* offsetTop is relative to the nearest positioned ancestor, and the sections are
   position:relative, so scene maths must use the document offset instead */
function docTop(el) {
  return el.getBoundingClientRect().top + (window.scrollY || document.documentElement.scrollTop || 0);
}
function scrollToEl(el, pad) {
  if (!el) return;
  var top = el.getBoundingClientRect().top + (LENIS ? LENIS.actualScroll || window.scrollY : window.scrollY);
  scrollToY(top - (pad || 0));
}

/* ---------------- media slots ---------------- */
function mkVideo(rec, fill) {
  var v = document.createElement("video");
  v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute("playsinline", "");
  v.preload = "metadata";           /* comps have no poster yet, see ASSETS.md */
  v.setAttribute("aria-label", rec.alt || "");
  /* a comp may carry an in/out point: loop inside the window where the action is,
     so the empty tail of a stock clip never reaches the page */
  if (rec.clip && rec.clip.length === 2) {
    /* start offset only: a "#t=in,out" range makes the browser PAUSE at the
       out point instead of looping, so the loop is driven from here */
    v.src = rec.src + "#t=" + rec.clip[0];
    v.addEventListener("timeupdate", function () {
      if (v.currentTime < rec.clip[1] - 0.05) return;
      try { v.currentTime = rec.clip[0]; } catch (e) {}
      if (v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    });
  } else v.src = rec.src;
  if (fill) { v.style.width = "100%"; v.style.height = "100%"; v.style.objectFit = "cover"; }
  players.push(v);
  return v;
}
function mkImage(rec) {
  var i = document.createElement("img");
  i.src = rec.src; i.alt = rec.alt || ""; i.loading = "lazy"; i.decoding = "async";
  i.style.width = "100%"; i.style.height = "100%"; i.style.objectFit = "cover";
  return i;
}
/* stills that move: a slow Ken Burns pan across the practice's own photographs,
   crossfading between them. Motion without asking anyone to shoot video. */
function mkStills(rec) {
  var w = document.createElement("div");
  w.className = "kb";
  rec.srcs.forEach(function (src, i) {
    var im = document.createElement("img");
    im.src = src;
    im.alt = (rec.alts && rec.alts[i]) || rec.alt || "";
    im.loading = i === 0 ? "eager" : "lazy";
    im.decoding = "async";
    if (i % 2) im.classList.add("alt");
    if (i === 0) im.classList.add("on");
    w.appendChild(im);
  });
  if (rec.srcs.length > 1 && !RM) {
    var i = 0, imgs = w.children;
    setInterval(function () {
      if (document.hidden) return;
      imgs[i].classList.remove("on");
      i = (i + 1) % imgs.length;
      imgs[i].classList.add("on");
    }, 5600);
  }
  return w;
}
/* the hero reel: five disciplines, crossfading. Video and stills mix freely, because
   free stock has no usable polo or barrel-racing footage in this landscape, so those
   two run as photographs in motion until the practice shoots them. */
function mkReel(rec) {
  var wrap = document.createElement("div");
  wrap.className = "reel";
  var lays = [], vids = [], segs = rec.segments;

  segs.forEach(function (seg, i) {
    var lay = document.createElement("div");
    lay.className = "reel-lay";
    if (seg.kind === "stills") {
      var kbw = document.createElement("div");
      kbw.className = "kb";
      seg.srcs.forEach(function (src, j) {
        var im = document.createElement("img");
        im.src = src; im.alt = seg.alt || "";
        im.loading = i === 0 ? "eager" : "lazy";
        im.decoding = "async";
        im.classList.add("on");
        if (j % 2) im.classList.add("alt");
        kbw.appendChild(im);
      });
      lay.appendChild(kbw);
      vids.push(null);
    } else {
      var vd = document.createElement("video");
      vd.muted = true; vd.loop = true; vd.playsInline = true;
      vd.setAttribute("playsinline", "");
      vd.preload = i <= 1 ? "metadata" : "none";
      if (seg.poster) vd.poster = seg.poster;   /* a real frame while the clip loads, never a black hero */
      vd.setAttribute("aria-label", seg.alt || "");
      vd.src = seg.src + (seg.clip ? "#t=" + seg.clip[0] : "");
      if (seg.clip) {
        vd.addEventListener("timeupdate", function () {
          if (vd.currentTime < seg.clip[1] - 0.05) return;
          try { vd.currentTime = seg.clip[0]; } catch (e) {}
          if (vd.paused) { var pr = vd.play(); if (pr && pr.catch) pr.catch(function () {}); }
        });
      }
      /* an optional crop: zoom in and slide the picture so the action
         clears the headline scrim on the left */
      if (seg.frame) {
        vd.style.transform = "scale(" + (seg.frame.zoom || 1) + ") translate(" +
          (seg.frame.x || "0") + "," + (seg.frame.y || "0") + ")";
        vd.style.transformOrigin = "center";
      }
      lay.appendChild(vd);
      vids.push(vd);
    }
    if (i === 0) lay.classList.add("on");
    wrap.appendChild(lay);
    lays.push(lay);
  });

  var label = document.createElement("span");
  label.className = "reel-label mono";
  label.textContent = segs[0].label;
  wrap.appendChild(label);

  var i = 0, timer = null, onScreen = true;
  function play(n) {
    var v = vids[n], seg = segs[n];
    if (!v) return;
    if (v.preload === "none") v.preload = "metadata";
    try { if (seg.clip && (v.currentTime < seg.clip[0] || v.currentTime > seg.clip[1])) v.currentTime = seg.clip[0]; } catch (e) {}
    var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
  }
  function show(n) {
    lays[i].classList.remove("on");
    if (vids[i]) vids[i].pause();
    i = n;
    lays[i].classList.add("on");
    /* the crossfade runs 1.1s, so the label steps aside and comes back with the
       new picture rather than naming it while the old one is still up */
    label.style.opacity = "0";
    clearTimeout(label.__t);
    label.__t = setTimeout(function () {
      label.textContent = segs[i].label;
      label.style.opacity = "";
      label.classList.remove("in"); void label.offsetWidth; label.classList.add("in");
    }, RM ? 0 : 430);
    play(i);
    /* warm the next one so the crossfade never lands on a black frame */
    var nx = (i + 1) % segs.length;
    if (vids[nx] && vids[nx].preload === "none") vids[nx].preload = "metadata";
  }
  function queue() {
    clearTimeout(timer);
    if (!onScreen || RM) return;
    timer = setTimeout(function () { show((i + 1) % segs.length); queue(); }, segs[i].hold || 7000);
  }
  if (!RM) { play(0); queue(); }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      onScreen = es[0].isIntersecting;
      if (onScreen) { play(i); queue(); }
      else { clearTimeout(timer); if (vids[i]) vids[i].pause(); }
    }, { threshold: 0 }).observe(wrap);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { clearTimeout(timer); if (vids[i]) vids[i].pause(); }
    else if (onScreen) { play(i); queue(); }
  });
  return wrap;
}
function mkPlaceholder(rec) {
  var d = document.createElement("div");
  d.className = "placeholder mono";
  d.innerHTML = "<b>Slot open</b><span>" + (rec.spec || "media") + "</span>";
  return d;
}
function fillSlot(host) {
  var key = host.getAttribute("data-slot"), rec = M[key];
  if (!rec) return;
  var fill = host.hasAttribute("data-fill");
  host.innerHTML = "";
  if (rec.kind === "reel") {
    host.appendChild(mkReel(rec));
    if (rec.source === "comp") {
      var rt = document.createElement("span");
      rt.className = "comp-tag mono"; rt.textContent = "Comp";
      rt.title = "Temporary stock comps, replace before launch";
      host.appendChild(rt);
    }
    return;
  }
  if (rec.kind === "stills") {
    if (!rec.srcs || !rec.srcs.length) { host.appendChild(mkPlaceholder(rec)); return; }
    host.appendChild(mkStills(rec));
    return;
  }
  if (!rec.src) { host.appendChild(mkPlaceholder(rec)); return; }
  host.appendChild(rec.kind === "image" ? mkImage(rec) : mkVideo(rec, fill));
  if (rec.source === "comp") {
    var t = document.createElement("span");
    t.className = "comp-tag mono"; t.textContent = "Comp";
    t.title = "Temporary stock comp, replace before launch";
    host.appendChild(t);
  }
}
function renderMedia(root) {
  (root || document).querySelectorAll("[data-slot]").forEach(function (h) {
    if (h.hasAttribute("data-manual")) return;
    fillSlot(h);
  });
  var tex = document.querySelector("[data-src-slot]");
  if (tex && M.texture) tex.src = M.texture.src;
}

/* play only what is on screen */
function watchPlayers() {
  if (!("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { if (!RM) { var p = v.play(); if (p && p.catch) p.catch(function(){}); } }
      else v.pause();
    });
  }, { threshold: 0.1 });
  players.forEach(function (v) { io.observe(v); });
}

/* ---------------- capability switcher ---------------- */
var CARE = [
  { k: "surgery", t: "Surgery", slot: "cap-surgery",
    h: "Standing and under general anesthesia.",
    d: "Emergency and elective procedures in a sterile theatre, with a padded recovery stall and someone watching until the horse is back on its feet.",
    li: ["Exploratory celiotomy for colic, at any hour",
         "Arthroscopy of carpus, fetlock and stifle; chip fragment removal",
         "Standing procedures: laryngoplasty, interspinous ligament desmotomy, sinus flap"] },
  { k: "lameness", t: "Lameness & sport horse", slot: "cap-lameness",
    h: "Finding the source before treating it.",
    d: "Flexion, diagnostic blocks and imaging in one visit, then a plan built around the competition calendar.",
    li: ["Blocks from the foot up, with the trot-up filmed at every stage",
         "Ultrasound of tendon and suspensory injury, with measurements kept for the re-check",
         "Regenerative therapy and a written return-to-work programme"] },
  { k: "imaging", t: "Imaging", slot: "cap-imaging",
    h: "Results before the horse leaves.",
    d: "Digital radiography and ultrasound in the hospital and off the truck, video endoscopy for the airway and stomach, bloodwork in the in-house laboratory.",
    li: ["Digital radiography for fractures, joint disease, hoof balance, dental and sinus work",
         "Video endoscopy for airway function, guttural pouches and gastric ulceration",
         "Scintigraphy and MRI arranged on referral, with our imaging and history sent ahead"] },
  { k: "ambulatory", t: "Ambulatory", slot: "cap-ambulatory",
    h: "The clinic in a truck.",
    d: "Routine work, lameness examinations and emergencies in your own barn aisle, with the hospital behind it when a case needs more.",
    li: ["Vaccination, Coggins, dentistry and deworming strategy",
         "Pre-purchase examinations with full imaging",
         "Field emergencies, with a direct line to the surgical hospital"] },
  { k: "emergency", t: "Emergency", slot: "cap-emergency",
    h: "Answered by a veterinarian, at any hour.",
    d: "Colic, wounds, choke, foaling trouble, a horse that will not put a foot down. Call before you load. We prepare while you drive.",
    li: ["A veterinarian takes the history on the phone",
         "Theatre prepared while the trailer is still on the road",
         "Post-operative intensive care and overnight monitoring"] }
];
function buildCare() {
  var tabs = document.getElementById("tabs"), panes = document.getElementById("panes");
  if (!tabs || !panes) return;
  var th = (M.thumbs || {});
  tabs.innerHTML = CARE.map(function (c, i) {
    var img = th[c.k] ? '<img src="' + th[c.k] + '" alt="" loading="lazy">' : "";
    return '<button class="tab" role="tab" type="button" id="tab-' + c.k + '" aria-controls="pane-' + c.k +
           '" aria-selected="' + (i === 0) + '">' + img + "<span>" + c.t + "</span></button>";
  }).join("");
  panes.innerHTML = CARE.map(function (c, i) {
    return '<div class="pane" role="tabpanel" id="pane-' + c.k + '" aria-labelledby="tab-' + c.k + '"' + (i ? " hidden" : "") + '>' +
      "<div><h3 class=\"h3\">" + c.h + "</h3><p class=\"split\" style=\"margin-top:16px;max-width:44ch\"><b>" + c.d + "</b></p>" +
      "<ul>" + c.li.map(function (s, j) { return "<li><i>" + String(j + 1).padStart(2, "0") + "</i><span>" + s + "</span></li>"; }).join("") + "</ul></div>" +
      '<div class="slot" data-ratio="4/5" data-slot="' + c.slot + '" data-cursor="Play"></div></div>';
  }).join("");
  renderMedia(panes);
  var ts = [].slice.call(tabs.children);
  function show(i) {
    ts.forEach(function (b, j) { b.setAttribute("aria-selected", j === i ? "true" : "false"); });
    [].slice.call(panes.children).forEach(function (p, j) { p.hidden = j !== i; });
  }
  ts.forEach(function (b, i) {
    b.addEventListener("click", function () { auto = false; show(i); });
    b.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : -1;
      if (n < 0 || n >= ts.length) return;
      auto = false; show(n); ts[n].focus(); e.preventDefault();
    });
  });
  /* auto-advance until the first click (§6.5) */
  var auto = !RM, i = 0;
  setInterval(function () { if (auto && !document.hidden) { i = (i + 1) % CARE.length; show(i); } }, 5200);
}

/* ---------------- surgical pathway ---------------- */
var STAGES = [
  ["The call", "A veterinarian hears the history, day or night. Together you decide whether the horse travels or we do."],
  ["Arrival &amp; triage", "Vitals, pain score, rectal and nasogastric tube where indicated, catheter placed, stall assigned."],
  ["Standing diagnostics", "Radiography, ultrasound, endoscopy and in-house bloodwork, before anything is decided."],
  ["The conversation", "Findings, options, odds and cost, before you are asked to consent."],
  ["Anesthesia", "Weight-based protocol, padded induction box, monitored throughout."],
  ["Surgery", "Sterile theatre, hydraulic table and hoist, surgeon and technician scrubbed for every case."],
  ["Recovery stall", "Padded walls, rope assistance where indicated, and someone in the room until the horse stands."],
  ["Discharge &amp; rehab", "Written aftercare, a graded return-to-work plan and a date for follow-up imaging."]
];
var stageEls = [], layerEls = [], nodeEls = [], curStage = -1;
function buildPathway() {
  var txt = document.getElementById("stageText"), med = document.getElementById("stageMedia"),
      nodes = document.getElementById("nodes"), path = document.getElementById("splinePath"),
      fill = document.getElementById("splineFill");
  if (!txt) return;
  txt.innerHTML = STAGES.map(function (s, i) {
    return '<div class="stage-copy"><span class="n">' + String(i + 1).padStart(2, "0") + " / 08</span><h3>" +
      s[0] + "</h3><p>" + s[1] + "</p></div>";
  }).join("");
  med.innerHTML = STAGES.map(function (s, i) {
    return '<div class="lay" data-slot="stage-' + (i + 1) + '" data-fill="1"></div>';
  }).join("");
  renderMedia(med);
  stageEls = [].slice.call(txt.children);
  layerEls = [].slice.call(med.querySelectorAll(".lay"));
  nodes.innerHTML = STAGES.map(function (s, i) {
    return '<button class="node" type="button" data-i="' + i + '"><i></i><span class="lbl">' +
      s[0].replace(/&amp;/g, "&") + "</span></button>";
  }).join("");
  nodeEls = [].slice.call(nodes.children);
  /* place each node on the drawn curve */
  var L = path.getTotalLength();
  nodeEls.forEach(function (n, i) {
    var p = path.getPointAtLength(L * (i / (STAGES.length - 1)));
    n.style.left = (p.x / 1000 * 100) + "%";
    n.style.top = (p.y / 72 * 100) + "%";
    n.addEventListener("click", function () { jumpTo(i); });
  });
  fill.style.strokeDasharray = L; fill.style.strokeDashoffset = L;
  window.__spline = { fill: fill, L: L };
  setStage(0);
}
function setStage(i) {
  if (i === curStage) return;
  curStage = i;
  stageEls.forEach(function (e, j) { e.classList.toggle("on", j === i); });
  layerEls.forEach(function (e, j) { e.classList.toggle("on", j === i); });
  nodeEls.forEach(function (e, j) {
    e.classList.toggle("on", j === i);
    e.classList.toggle("done", j < i);
  });
}
function jumpTo(i) {
  var track = document.getElementById("pinTrack");
  if (!track || MOBILE()) return;
  var total = track.offsetHeight - window.innerHeight;
  scrollToY(docTop(track) + total * ((i + 0.5) / STAGES.length));
}
function pathwayScroll() {
  var track = document.getElementById("pinTrack");
  if (!track || !stageEls.length) return;
  if (MOBILE()) {
    /* no pinning on a phone: the eight stages read as a list, with one
       representative clip above it rather than eight orphaned ones */
    stageEls.forEach(function (e) { e.classList.add("on"); });
    layerEls.forEach(function (e, i) { e.classList.toggle("m-show", i === 0); });
    return;
  }
  layerEls.forEach(function (e) { e.classList.remove("m-show"); });
  var total = track.offsetHeight - window.innerHeight;
  var p = (window.scrollY - docTop(track)) / Math.max(1, total);
  p = Math.max(0, Math.min(0.9999, p));
  setStage(Math.floor(p * STAGES.length));
  var s = window.__spline;
  if (s) s.fill.style.strokeDashoffset = s.L * (1 - p);
}

/* ---------------- team ---------------- */
var TEAM = [
  ["axel", "Axel Sondhof, DVM, MS", "Founder &amp; surgeon",
   "Munich and Cambridge, then a surgical residency at Iowa State. Colic, performance problems in sport horses, infectious arthritis in foals."],
  ["nutt", "Jim Nutt IV, VMD, DACVS", "Veterinary surgeon",
   "Board certified: a diplomate of the American College of Veterinary Surgeons. Colic surgery, fracture repair, arthroscopy, laparoscopy, and imaging up to scintigraphy and MRI."],
  ["jacoba", "Jacoba Barboza", "Practice manager",
   "With Dr. Sondhof since 2009, and around horses since she was ten. Usually the voice on the other end of the phone."],
  ["victoria", "Victoria Walton, LVT", "Licensed veterinary technician",
   "Five years on the nursing staff at Rood &amp; Riddle in Lexington. Down and neurologic horses, podiatry, pain management, high-risk mares."],
  ["katey", "Katey Rowe, LVT", "Head anesthesia technician",
   "Years of equine anesthesia at Rood &amp; Riddle in Saratoga. She joined the day this hospital opened."],
  ["olin", "Olin Ellsworth", "Farrier",
   "Third generation at the anvil. Saratoga in summer, Ocala over the winter circuit. He works the podiatry cases off the same radiographs we do."],
  ["christie", "Christie Foss-Hugabone", "Assistant",
   "Hunter-jumpers since she was six, and years of managing private stables. Working towards her licence as a veterinary technician."],
  ["joann", "JoAnn Negri", "Assistant",
   "Trail rider and Gypsy Vanner owner, and a sixth-degree black belt in karate."],
  ["kestrel", "Kestrel", "Assistant",
   "Saratoga born and rarely indoors. Named after the smallest falcon in North America."],
  ["trisha", "Trisha VanDerwerken", "Saratoga Horse Rx",
   "Albany College of Pharmacy, 2000. She keeps the pharmacy running and fills the orders."],
  ["tammy", "Tammy Lynch", "Accounts payable",
   "Twenty years in banking before she came to the clinic in 2019. Four horses and two dogs at home."]
];
/* ---------- why: eight problems, each with a panel that demonstrates it ---------- */
var WHY = [
  { t: "Colic does not keep office hours",
    p: "The call at two in the morning is taken by a veterinarian, and the theatre is being prepared while you are still hitching the trailer. Neither the distance nor the preparation improves while you wait for business hours.",
    word: "Colic",
    card: "Time to the table", pill: "24/7", kind: "race",
    rows: [["Referred out", "hours", 0, 92], ["Here", "minutes", 1, 24]],
    tick: ["A veterinarian takes the history", "Theatre being prepared", "Horse on the table"] },
  { t: "A lameness that blocks out nowhere",
    p: "Flexion, diagnostic blocks, radiography and ultrasound inside one visit, because they are all inside one building. A work-up split across two practices and three appointments usually takes three weeks.",
    word: "Lameness",
    card: "Appointments to an answer", pill: "One visit", kind: "race",
    rows: [["Two practices", "3 visits", 0, 86], ["Here", "1 visit", 1, 30]],
    tick: ["Flexion and blocks", "Radiographs read with you", "A plan you leave with"] },
  { t: "Imaging in your own barn aisle",
    p: "Digital radiography and ultrasound travel on the truck. Most horses never need to be hauled anywhere to find out what is wrong with them.",
    word: "Imaging",
    card: "Images on screen", pill: "Off the truck", kind: "plate",
    tick: ["Exposure taken in the aisle", "On the screen in seconds", "Reviewed with you on the spot"] },
  { t: "The cost conversation happens before the consent",
    p: "Findings, the options, the odds for each and what each one costs, while you can still choose between them. Not afterwards, on the invoice.",
    word: "Cost",
    card: "Estimate", pill: "Before consent", kind: "estimate",
    rows: [["Exploratory celiotomy", ""], ["Anaesthesia and theatre", ""], ["Hospitalisation, per night", ""], ["Estimate total", "to confirm"]],
    tick: ["Figures to confirm with the practice", "Signed before anything starts"] },
  { t: "Saturday, Sunday, Christmas morning",
    p: "The emergency line is answered every day of the year, by someone who can tell you whether to load the trailer or wait for the morning.",
    word: "Sunday",
    card: "Cover", pill: "7 / 7", kind: "week",
    tick: ["No day of the week is off", "Answered by a veterinarian"] },
  { t: "Your farrier and your veterinarian, off one set of radiographs",
    p: "Podiatry goes wrong when the shoeing plan and the imaging sit in two different heads. Ours are read together, in the same aisle, on the same day.",
    word: "Podiatry",
    card: "The plan", pill: "One plan", kind: "converge",
    tick: ["Radiographs read together", "One plan, two sets of hands"] },
  { t: "Somebody stays until the horse is standing",
    p: "Recovery from general anaesthesia is the most dangerous part of an elective surgery. It happens in a padded stall, with rope assistance where it is indicated, and a technician in the room.",
    word: "Recovery",
    card: "Recovery stall", pill: "Watched", kind: "trace",
    tick: ["Monitored from the first breath", "Watched until the horse stands"] },
  { t: "The case goes back to your veterinarian",
    p: "The report goes to the practice that sent the horse, the same day. Routine care stays where it was.",
    word: "Referral",
    card: "Referral", pill: "Returned", kind: "loop",
    tick: ["Report sent the same day", "Routine care stays with your vet"] }
];

function panelBody(w) {
  if (w.kind === "race") {
    return w.rows.map(function (r) {
      return '<div class="race-row' + (r[2] ? " win" : "") + '"><span class="rl">' + r[0] +
        '</span><span class="track"><i style="--w:' + (r[3] || 90) + '%"></i></span>' +
        '<span class="rv">' + r[1] + "</span></div>";
    }).join("");
  }
  if (w.kind === "week") {
    return '<div class="week">' + ["M", "T", "W", "T", "F", "S", "S"].map(function (d) {
      return '<span class="wd">' + d + "</span>"; }).join("") + "</div>";
  }
  if (w.kind === "plate") {
    /* the practice's own photograph, revealed by the sweep. Nothing drawn: a
       hand-made radiograph is exactly the invented content this site avoids. */
    var shot = (window.MEDIA && window.MEDIA.own) ? window.MEDIA.own("ultrasound", 600) : "";
    return '<div class="plate">' +
      (shot ? '<img class="shot" src="' + shot + '" alt="The team working around a horse with the ultrasound cart at the clinic.">' : "") +
      '<span class="sweep"></span></div>';
  }
  if (w.kind === "estimate") {
    return '<div class="est">' + w.rows.map(function (r, i) {
      return '<div class="est-row' + (i === w.rows.length - 1 ? " total" : "") + '"><span>' + r[0] +
        "</span><span>" + r[1] + "</span></div>"; }).join("") + "</div>";
  }
  if (w.kind === "trace") {
    return '<div class="trace"><svg viewBox="0 0 220 58" aria-hidden="true">' +
      '<path d="M2 40 L34 40 L42 20 L50 48 L58 40 L92 40 L100 26 L108 44 L116 40 L150 40 L160 14 L172 40 L214 40"></path>' +
      '<text class="mark" x="146" y="10">standing</text></svg></div>';
  }
  if (w.kind === "converge") {
    return '<div class="dia"><svg viewBox="0 0 220 76" aria-hidden="true">' +
      '<path class="a" d="M6 18 C 70 18, 90 38, 148 38"></path>' +
      '<path class="b" d="M6 60 C 70 60, 90 38, 148 38"></path>' +
      '<circle cx="150" cy="38" r="3.5" fill="#1E6E5E" opacity=".7"></circle>' +
      '<text x="6" y="12">Radiographs</text><text x="6" y="74">Farrier</text>' +
      '<text x="160" y="42">One plan</text></svg></div>';
  }
  if (w.kind === "loop") {
    return '<div class="dia"><svg viewBox="0 0 220 76" aria-hidden="true">' +
      '<path class="a" d="M26 28 C 80 6, 140 6, 192 28"></path>' +
      '<path class="b" d="M192 50 C 140 72, 80 72, 26 50"></path>' +
      '<circle cx="20" cy="39" r="4" fill="#6B6F66" opacity=".7"></circle>' +
      '<circle cx="198" cy="39" r="4" fill="#1E6E5E" opacity=".7"></circle>' +
      '<text x="2" y="72">Your vet</text><text x="158" y="14">Hospital</text></svg></div>';
  }
  return "";
}

/* the pinned background names the item the reader is level with */
var whyWord = null, whyGlow = null, whyItems = [], whyAt = -1;
function whyBg() {
  if (!whyWord || !whyItems.length || window.innerWidth <= 900) return;
  var mid = window.innerHeight * 0.5, best = -1, bestD = 1e9;
  for (var i = 0; i < whyItems.length; i++) {
    var r = whyItems[i].getBoundingClientRect();
    var d = Math.abs(r.top + r.height / 2 - mid);
    if (d < bestD) { bestD = d; best = i; }
  }
  if (best < 0 || best === whyAt) return;
  whyAt = best;
  var txt = (WHY[best] && WHY[best].word) || "";
  if (RM) { whyWord.textContent = txt; return; }
  whyWord.classList.add("out");
  clearTimeout(whyWord.__t);
  whyWord.__t = setTimeout(function () {
    whyWord.textContent = txt;
    whyWord.classList.remove("out");
  }, 260);
  if (whyGlow) {
    whyGlow.style.transform = "translate3d(" + ((best % 2 ? -7 : 7)) + "%," +
      (best * 2.4 - 8) + "%,0)";
  }
}

function buildWhy() {
  var host = document.getElementById("whyList");
  if (!host) return;
  host.innerHTML = WHY.map(function (w, i) {
    var calm = (w.pill === "Before consent" || w.pill === "One plan");
    return '<div class="why-item"><span class="n">' + String(i + 1).padStart(2, "0") + "</span>" +
      "<div><h3>" + w.t + "</h3><p>" + w.p + "</p></div>" +
      '<div class="pcard"><div class="ph"><span class="pt">' + w.card +
        '</span><span class="pill' + (calm ? " calm" : "") + '">' + w.pill + "</span></div>" +
        '<div class="pb">' + panelBody(w) + "</div>" +
        '<div class="pf"><span></span></div></div></div>';
  }).join("");

  /* a panel runs only while it is on screen; each footer cycles its own ticker */
  whyWord = document.getElementById("whyWord");
  whyGlow = document.querySelector(".why-bg .glow");
  whyItems = [].slice.call(host.querySelectorAll(".why-item"));
  var cards = [].slice.call(host.querySelectorAll(".pcard"));
  cards.forEach(function (c, i) {
    var line = c.querySelector(".pf span"), msgs = WHY[i].tick || [];
    if (!msgs.length) return;
    line.textContent = msgs[0];
    c.__i = 0;
    c.__step = function () {
      c.__i = (c.__i + 1) % msgs.length;
      line.style.animation = "none"; void line.offsetWidth; line.style.animation = "";
      line.textContent = msgs[c.__i];
    };
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var c = e.target;
        if (e.isIntersecting) {
          c.classList.add("run");
          if (!c.__timer && c.__step && !RM) c.__timer = setInterval(c.__step, 2133);
        } else { clearInterval(c.__timer); c.__timer = null; }
      });
    }, { threshold: 0.25 });
    cards.forEach(function (c) { io.observe(c); });
  } else cards.forEach(function (c) { c.classList.add("run"); });
}

function buildTeam() {
  var g = document.getElementById("teamGrid");
  if (!g) return;
  var ph = (M.portraits || {});
  g.innerHTML = TEAM.map(function (t) {
    var im = ph[t[0]]
      ? '<img src="' + ph[t[0]] + '" alt="' + t[1] + '" loading="lazy" decoding="async">'
      : '<div class="placeholder mono"><b>Portrait open</b><span>' + t[1] + '</span></div>';
    return '<div class="member"><div class="slot" data-ratio="4/5">' + im + "</div>" +
      '<div class="txt"><h3>' + t[1] + '</h3><span class="role mono">' + t[2] + "</span><p>" + t[3] + "</p></div></div>";
  }).join("") +
    '<div class="member calltile"><span class="mono">Any hour</span>' +
    '<b>518-584-1633</b>' +
    '<span>The phone that gets answered at three in the morning.</span>' +
    '<a class="mono" href="tel:+15185841633">Call the clinic</a></div>';
}

/* ---------------- chrome ---------------- */
function chrome() {
  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger"), links = document.getElementById("navlinks");
  burger.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.textContent = open ? "Close" : "Menu";
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      links.classList.remove("open"); burger.textContent = "Menu";
      burger.setAttribute("aria-expanded", "false");
    }
  });

  var clock = document.getElementById("clock");
  function tick() {
    try {
      var f = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", timeZoneName: "short", hour12: false });
      clock.textContent = "Saratoga Springs \u00b7 " + f.format(new Date()) + " \u00b7 the line is open";
    } catch (e) { clock.textContent = "Saratoga Springs, NY \u00b7 the line is open"; }
  }
  tick(); setInterval(tick, 30000);

  var words = ["Thoroughbred", "Standardbred", "Hunter &amp; jumper", "Dressage", "Eventing", "Driving",
               "Western performance", "Pleasure &amp; companion", "Foals &amp; broodmares", "Referrals from every practice"];
  var one = words.map(function (w) { return "<span>" + w + "</span>"; }).join("");
  var mq = document.getElementById("marquee"); if (mq) mq.innerHTML = one + one;

  /* film modal */
  var modal = document.getElementById("filmModal"), host = modal.querySelector("[data-slot]");
  document.getElementById("playFilm").addEventListener("click", function () {
    if (!host.firstChild) {
      var rec = M.film;
      if (rec && rec.src) {
        var v = mkVideo(rec, true); v.muted = false; v.loop = false; v.controls = true;
        host.appendChild(v);
        if (rec.source === "comp") {
          var t = document.createElement("span"); t.className = "comp-tag mono"; t.textContent = "Comp"; host.appendChild(t);
        }
      } else host.appendChild(mkPlaceholder(rec || { spec: "THE FILM" }));
    }
    modal.hidden = false;
    var v2 = host.querySelector("video"); if (v2) { var p = v2.play(); if (p && p.catch) p.catch(function(){}); }
  });
  function closeFilm() {
    modal.hidden = true;
    var v = host.querySelector("video"); if (v) v.pause();
  }
  document.getElementById("closeFilm").addEventListener("click", closeFilm);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeFilm(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeFilm(); });

  /* cursor label over video tiles */
  var cur = document.getElementById("cursor");
  document.addEventListener("mousemove", function (e) {
    var t = e.target.closest ? e.target.closest("[data-cursor]") : null;
    if (t) {
      cur.textContent = t.getAttribute("data-cursor");
      cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px";
      cur.classList.add("on");
    } else cur.classList.remove("on");
  }, { passive: true });

  /* in-page anchors */
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (!id) { e.preventDefault(); scrollToY(0); return; }
    var el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    scrollToEl(el, id === "top" ? 0 : 72);
    history.replaceState(null, "", "#" + id);
  });

  /* form */
  var form = document.getElementById("apptForm"), sent = document.getElementById("sent");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = document.getElementById("fname"), p = document.getElementById("fphone");
    if (!n.value.trim()) { n.focus(); n.style.borderColor = "#D2542A"; return; }
    if (!p.value.trim()) { p.focus(); p.style.borderColor = "#D2542A"; return; }
    var esc = function (s) { return s.replace(/[<>&"]/g, ""); };
    sent.innerHTML = "<b>Thank you, " + esc(n.value.trim().split(" ")[0]) + ".</b><br>Noted: " +
      esc(document.getElementById("freason").value.toLowerCase()) + ". Once this form is wired to the practice inbox it reaches the front desk at 163 Daniels Road, and you get a call back on " +
      esc(p.value.trim()) + " the same day.<br><br>If anything changes before then, call 518-584-1633.";
    sent.hidden = false; form.hidden = true;
    scrollToEl(sent, window.innerHeight * 0.3);
  });

  /* counters */
  var counted = false;
  function counters() {
    if (counted) return;
    var els = [].slice.call(document.querySelectorAll("[data-count]"));
    if (!els.length) return;
    var top = els[0].getBoundingClientRect().top;
    if (top > window.innerHeight * 0.9) return;
    counted = true;
    els.forEach(function (el) {
      var to = parseInt(el.getAttribute("data-count"), 10), t0 = performance.now();
      if (RM) { el.textContent = to; return; }
      (function step(now) {
        var k = Math.min(1, (now - t0) / 900);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* reveals: everything starts visible; only what is below the fold is hidden first */
  if (!RM && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove("hide"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".sec-head, .split2 > *, .figs, .case > *, .team, .contact > *").forEach(function (el, i) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      el.classList.add("rv", "hide");
      el.style.transitionDelay = Math.min(i % 4, 3) * 60 + "ms";
      io.observe(el);
    });
  }

  /* one scroll read per frame */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      nav.classList.toggle("stuck", window.scrollY > 10);
      pathwayScroll();
      whyBg();
      counters();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { pathwayScroll(); }, { passive: true });
  onScroll();
}

/* ---------------- content.json ----------------
   Text lives in content.json so it can be edited without touching code.
   index.html carries the same wording inline, so if that file is missing,
   malformed, or blocked (opening the page over file://), the page still
   renders in full. The override simply does not happen. */
function resolve(obj, path) {
  var p = path.split("."), v = obj;
  for (var i = 0; i < p.length; i++) { if (v == null) return null; v = v[p[i]]; }
  return typeof v === "string" ? v : null;
}
function applyContent(c) {
  if (!c) return;
  if (c.sections) {
    [].slice.call(document.querySelectorAll("[data-c]")).forEach(function (el) {
      var v = resolve(c.sections, el.getAttribute("data-c"));
      if (v != null) el.innerHTML = v;
    });
  }
  if (Array.isArray(c.care) && c.care.length) CARE = c.care;
  if (Array.isArray(c.stages) && c.stages.length) STAGES = c.stages;
  if (Array.isArray(c.why) && c.why.length) WHY = c.why;
  if (Array.isArray(c.team) && c.team.length) TEAM = c.team;
}
function inlineContent() {
  var el = document.getElementById("contentData");
  if (!el) return null;
  try { return JSON.parse(el.textContent); } catch (e) { return null; }
}
function withContent(next) {
  var inline = inlineContent();
  var done = false;
  var go = function (c) {
    if (done) return;
    done = true;
    try { applyContent(c || inline); } catch (e) {}
    next();
  };
  /* Opened straight off the disk, a browser refuses to read the file next to
     the page. Use the embedded copy and do not even try. */
  if (!window.fetch || location.protocol === "file:") { go(null); return; }
  setTimeout(function () { go(null); }, 2500);      /* never hang on a slow file */
  fetch("content.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(go)
    .catch(function () { go(null); });
}

/* ---------------- boot ---------------- */
function boot() { withContent(start); }
function start() {
  renderMedia(document);
  buildCare();
  buildWhy();
  buildTeam();
  buildPathway();
  chrome();
  watchPlayers();
  if (window.Lenis && !RM && !MOBILE()) {
    LENIS = new window.Lenis({ duration: 1.05, smoothWheel: true });
    function raf(t) { LENIS.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    LENIS.on("scroll", function () {
      document.getElementById("nav").classList.toggle("stuck", window.scrollY > 10);
      pathwayScroll();
    });
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
})();
