/* ============================================================
   MEDIA MANIFEST: the single source of truth for every media slot.
   Swap a slot by dropping a file into assets/media/ and setting
   `local:` below. Empty slots render as marked placeholders (§11).

   RULE: every clip shows a horse in a human context: in work, in training, in
   competition, or under someone's hands. No loose or wild herds, however cinematic.
   Test: would this horse be a patient here?

   clip:    [in, out] in seconds, the populated window of a comp. The player loops
            inside it, so a clip whose action leaves frame never shows the empty tail.
            Drop it once the real edit is cut to length.

   source:  "comp"     temporary stock comp, MUST be replaced (Pexels licence)
            "reused"   from the old Squarespace site, within the §2 size ceiling
            "todo"     nothing yet, renders a placeholder with its spec
   ============================================================ */
window.MEDIA = (function () {
  var SQ = "https://images.squarespace-cdn.com/content/v1/5f4bd2aa04cf1d5f704237d1/";
  var PX = "https://videos.pexels.com/video-files/";
  var v = function (id, file) { return PX + id + "/" + file; };
  /* the practice's own photographs, straight off their Squarespace library.
     w = the true original width, so nothing is ever shown above its true size. */
  /* The practice's own photographs, served from this folder instead of the old
     Squarespace CDN. The site therefore keeps working the day that account is
     closed. Original files and their true sizes are listed in ASSETS.md. */
  var PHOTO = "assets/media/photos/";
  var own = function (k) { return PHOTO + k + ".jpg"; };

  return {
    /* the photo library, exposed so sister pages (rx.html) can draw on it */
    own: own,
    stillsFor: function (keys) { return keys.map(function (k) { return own(k, 1500); }); },

    /* ---------- hero ---------- */
hero: {
      kind: "reel", source: "comp", credit: "Pexels, free licence",
      spec: "HERO REEL \u00b7 every segment 5.5 s \u00b7 five disciplines \u00b7 each 1920\u00d71080 + a 1080\u00d71350 portrait encode",
      /* The landscape test: green turf, deciduous tree lines, white rails, soft northern
         light. Saratoga County in July. Never arid scrub, palms or desert light.
         Polo and barrel racing exist here as photographs in motion: free stock has no
         usable footage of either in the right setting. Both are first in line to be shot. */
      segments: [
        { label: "Polo", kind: "video", hold: 5000,
          src: "assets/media/hero-polo.mp4", poster: "assets/media/poster-polo.jpg",
          frame: { zoom: 1.12, x: "6%", y: "0%" },
          alt: "Two polo players riding a play out on grass, tree line behind.",
          spec: "POLO \u00b7 generated clip, 1280x704 \u00b7 re-encode to 1920x1080 under 3 MB before launch" },
        { label: "On the track", kind: "video", hold: 5500,
          src: v("16794014", "16794014-hd_1920_1080_24fps.mp4"), clip: [2, 8],
          alt: "A race meeting: the field on the dirt, the grandstand full." },
        { label: "Dressage", kind: "video", hold: 5500,
          src: v("5087844", "5087844-hd_1920_1080_25fps.mp4"), clip: [1.5, 5.5],
          alt: "Horse and rider working in the arena under a grey sky." },
        { label: "Show jumping", kind: "video", hold: 5000,
          src: "assets/media/hero-jumping.mp4", poster: "assets/media/poster-jumping.jpg",
          frame: { zoom: 1.12, x: "6%", y: "0%" },
          alt: "A horse and rider landing over a white oxer in a sand arena.",
          spec: "SHOW JUMPING \u00b7 generated clip, 1280x704 \u00b7 re-encode before launch" },
        { label: "Barrel racing", kind: "video", hold: 5000,
          src: "assets/media/hero-barrel.mp4", poster: "assets/media/poster-barrel.jpg",
          alt: "A horse and rider turning hard around the barrel, dust rising.",
          spec: "BARREL RACING \u00b7 generated clip, 1280x704 \u00b7 re-encode before launch" }
      ]
    },

    /* ---------- capability switcher ---------- */
    "cap-surgery":   { kind: "stills", source: "own",
      srcs: [own("theatre"), own("arthroscopy", 1600), own("ovariectomy", 1600)],
      alts: ["The clinic's surgical suite: hydraulic table, anaesthesia machine and monitors.",
             "A bilateral hock arthroscopy under way, the limb suspended and draped.",
             "A standing ovariectomy, sterile field and instrument tray in the foreground."],
      spec: "SURGICAL SUITE \u00b7 replace with motion of these same rooms" },
    "cap-lameness":  { kind: "stills", source: "own",
      srcs: [own("trotUp", 1600), own("exam")],
      alts: ["A technician standing a horse up on a hard surface for examination.",
             "Two clinicians examining a horse at the clinic."],
      spec: "TROT-UP · replace with motion: the horse coming towards camera" },
    "cap-imaging":   { kind: "stills", source: "own",
      srcs: [own("handsOn", 1500), own("stalls")],
      alts: ["A clinician working hands-on with a horse at the hospital.",
             "The hospital stalls, with monitoring equipment in the aisle."],
      spec: "IMAGING · replace with motion: probe and screen, radiograph coming up" },
    "cap-ambulatory":{ kind: "stills", source: "own",
      srcs: [own("inBarn", 1500), own("building", 1600)],
      alts: ["The practice at work with a horse in its own barn.",
             "The clinic on Daniels Road."],
      spec: "AMBULATORY · replace with motion: the truck's open doors, a barn aisle" },
    "cap-emergency": { kind: "video", src: v("7671665", "7671665-hd_1920_1080_24fps.mp4"), source: "comp",
      spec: "EMERGENCY INTAKE · 4–6 s · headlights on the barn aisle at first light",
      alt: "A barn aisle at dawn, light falling through the far doorway." },

    /* ---------- surgical pathway, one layer per stage ---------- */
    "stage-1": { kind: "stills", source: "own",
      srcs: [own("building", 1600)],
      alts: ["The Equine Clinic of Saratoga on Daniels Road."],
      spec: "THE CALL \u00b7 the phone in the office at night" },
    "stage-2": { kind: "stills", source: "own",
      srcs: [own("stalls"), own("building", 1600)],
      alts: ["The hospital stalls.", "The clinic on Daniels Road."],
      spec: "ARRIVAL & TRIAGE \u00b7 unloading, first vitals" },
    "stage-3": { kind: "stills", source: "own",
      srcs: [own("handsOn", 1500), own("ultrasound")],
      alts: ["Hands-on examination at the hospital.", "The team working around a horse with the ultrasound cart."],
      spec: "STANDING DIAGNOSTICS \u00b7 radiography, ultrasound, endoscopy" },
    "stage-4": { kind: "stills", source: "own",
      srcs: [own("inBarn", 1500)],
      alts: ["The practice talking with an owner beside the horse."],
      spec: "THE CONVERSATION \u00b7 surgeon and owner at the stall door" },
    "stage-5": { kind: "stills", source: "own",
      srcs: [own("theatre")],
      alts: ["The surgical suite prepared, anaesthesia machine at the head of the table."],
      spec: "ANAESTHESIA \u00b7 padded induction box" },
    "stage-6": { kind: "stills", source: "own",
      srcs: [own("arthroscopy", 1600), own("ovariectomy", 1600)],
      alts: ["A bilateral hock arthroscopy under way.", "A standing ovariectomy, sterile field prepared."],
      spec: "SURGERY \u00b7 the practice own photographs" },
    "stage-7": { kind: "stills", source: "own",
      srcs: [own("exam")],
      alts: ["Two clinicians attending a horse at the clinic."],
      spec: "RECOVERY STALL \u00b7 the horse getting to its feet" },
    "stage-8": { kind: "stills", source: "own",
      srcs: [own("trotUp", 1600)],
      alts: ["A technician standing the horse up again, back in work."],
      spec: "DISCHARGE & REHAB \u00b7 the first trot-up back" },
    /* ---------- film (modal, with sound) ---------- */
    film: { kind: "video", src: v("5087844", "5087844-hd_1920_1080_25fps.mp4"), clip: [1.5, 10.5], source: "comp",
      spec: "THE FILM · 60–90 s · with sound · the practice in one day, first call to discharge",
      alt: "The practice film." },

    /* ---------- reused from the old site, inside the §2 ceiling ---------- */
    practice: { kind: "stills", source: "own",
      srcs: [own("building", 1600), own("trotUp", 1600), own("ultrasound")],
      alts: ["The Equine Clinic of Saratoga on Daniels Road.",
             "A technician standing a horse up for examination.",
             "The team working around a horse with the ultrasound cart."],
      spec: "PRACTICE · the practice's own photographs" },
    building: { kind: "image", src: PHOTO + "buildingWeb.jpg",
      source: "reused", max: 450, orig: "900 × 600",
      spec: "THE BUILDING · reshoot in the same light as the hero",
      alt: "The clinic on Daniels Road seen from the road." },
    texture: { kind: "image", src: PHOTO + "texture.jpg",
      source: "reused", max: 2000, orig: "2000 × 1440", spec: "SECTION TEXTURE", alt: "" },

    /* service thumbnails, 600 × 600 originals served at 300 w, shown at 24 px */
    thumbs: {
      surgery: PHOTO + "thumb-surgery.jpg",
      lameness: PHOTO + "thumb-lameness.jpg",
      imaging: PHOTO + "thumb-imaging.jpg",
      ambulatory: PHOTO + "thumb-ambulatory.jpg",
      emergency: PHOTO + "thumb-emergency.jpg",
      dental: PHOTO + "thumb-dental.jpg"
    },

    /* ---------- still open ---------- */
    "case-before": { kind: "stills", source: "own", srcs: [own("exam")],
      alts: ["The horse at presentation, examined by two clinicians."],
      spec: "CASE · replace with the pre-operative radiograph, owner's written consent required" },
    "case-after":  { kind: "stills", source: "own", srcs: [own("trotUp", 1600)],
      alts: ["The same horse stood up again twelve weeks later."],
      spec: "CASE · replace with the post-operative radiograph, same projection and scale" },
    /* the practice's own headshots: 600 x 636 originals shown at 300 px - exactly the ceiling */
    portraits: {
      axel:     PHOTO + "team-axel.jpg",
      jacoba:   PHOTO + "team-jacoba.jpg",
      victoria: PHOTO + "team-victoria.jpg",
      katey:    PHOTO + "team-katey.jpg",
      tammy:    PHOTO + "team-tammy.jpg",
      trisha:   PHOTO + "team-trisha.jpg",
      joann:    PHOTO + "team-joann.jpg",
      kestrel:  PHOTO + "team-kestrel.jpg",
      olin:     PHOTO + "team-olin.jpg"
    }
  };
})();
