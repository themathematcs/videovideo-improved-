import fs from "fs";
import path from "path";

const docsDemosDir = path.join(process.cwd(), "docs", "demos");
const distDemosDir = path.join(process.cwd(), "dist", "demos");

function saveDemo(slug: string, html: string) {
  const p1 = path.join(docsDemosDir, slug, "index.html");
  const p2 = path.join(distDemosDir, slug, "index.html");
  fs.mkdirSync(path.dirname(p1), { recursive: true });
  fs.mkdirSync(path.dirname(p2), { recursive: true });
  fs.writeFileSync(p1, html, "utf-8");
  fs.writeFileSync(p2, html, "utf-8");
  console.log(`✅ Saved full-content white-mode demo for: ${slug}`);
}

interface DemoConfig {
  slug: string;
  name: string;
  niche: string;
  city: string;
  address: string;
  phone: string;
  rating: number;
  reviewsCount: number;
  accentColor: string; // Tailwind hex or class
  accentHover: string;
  accentLight: string;
  accentBorder: string;
  badgeText: string;
  fontImport: string;
  headingFont: string;
  heroHeadline: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroImage: string;
  imageAlt: string;
  imageBadge: string;
  whyChooseUs: Array<{ title: string; desc: string; icon: string }>;
  services: Array<{ title: string; desc: string; bullets: string[]; icon: string; image?: string }>;
  testimonials: Array<{ quote: string; author: string; role: string }>;
  hours: { weekday: string; saturday: string; sunday: string };
  ctaBannerTitle: string;
  ctaBannerSubtitle: string;
}

const DEMOS: DemoConfig[] = [
  // 1. SULTAN SANDS LUXURY BEACH VILLA (DIANI BEACH)
  {
    slug: "sultan-sands-luxury-beach-villa-diani",
    name: "Sultan Sands Luxury Beach Villa",
    niche: "Luxury Beachfront Villa & Private Chef Retreat",
    city: "Diani Beach",
    address: "Galu Kinondo Road, Diani Beach, South Coast",
    phone: "+254722667788",
    rating: 4.9,
    reviewsCount: 54,
    accentColor: "#B45309",
    accentHover: "#92400E",
    accentLight: "#FEF3C7",
    accentBorder: "#FDE68A",
    badgeText: "5-Star Oceanfront Private Compound",
    fontImport: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    headingFont: "'Playfair Display', serif",
    heroHeadline: "Private Oceanfront Sanctuary with",
    heroHighlight: "Dedicated Butler & Chef",
    heroSubtitle: "Experience barefoot coastal elegance on Kenya's south coast. 5 private suites with infinity pool, personalized seafood dining, and direct white-sand beach access.",
    heroImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Luxury Beach Villa in Diani",
    imageBadge: "Galu Beachfront",
    whyChooseUs: [
      { title: "Direct Oceanfront Access", desc: "Step directly onto the secluded white sands of Galu Beach with private sun loungers and cabanas.", icon: "waves" },
      { title: "Executive Private Chef", desc: "Customized Swahili fusion cuisine, fresh crab, prawns, and tropical fruit breakfasts cooked daily.", icon: "utensils" },
      { title: "Full Privacy & Gated Security", desc: "Private compound reserved exclusively for your family with 24/7 security and butler service.", icon: "shield-check" }
    ],
    services: [
      { title: "Exclusive Whole-Villa Buyout", desc: "Full access to all 5 en-suite suites, private infinity pool, and landscaped tropical gardens.", bullets: ["Accommodates up to 12 guests", "Daily housekeeping & laundry", "Air-conditioned oceanview suites"], icon: "home" },
      { title: "Bespoke Chef Dining Service", desc: "Gourmet breakfasts, poolside barbecue lunches, and candlelit seafood dinners under the stars.", bullets: ["Fresh seafood from local fishermen", "Tailored dietary menus", "Full cocktail & beverage service"], icon: "coffee" },
      { title: "VIP Coastal Concierge", desc: "End-to-end transport and activity coordination throughout your coastal Kenya getaway.", bullets: ["Ukunda Airstrip VIP pickup", "Wasini Island dolphin dhow tours", "Deep sea game fishing charters"], icon: "compass" }
    ],
    testimonials: [
      { quote: "Our two weeks at Sultan Sands were the absolute highlight of our year. Waking up to ocean waves, having Chef Ali prepare fresh garlic lobster by the pool, and direct beach strolls—pure magic.", author: "Julian & Sophie Von Berg", role: "Guests from Switzerland" },
      { quote: "Direct WhatsApp booking was so easy! Best family reunion stay in Diani with top-tier security and butler service. We will definitely return.", author: "Wanjiku Muthoni", role: "Nairobi Guest" }
    ],
    hours: { weekday: "Guest Services: 24/7", saturday: "Guest Services: 24/7", sunday: "Guest Services: 24/7" },
    ctaBannerTitle: "Reserve Your Private Oceanfront Escape",
    ctaBannerSubtitle: "Check availability, custom chef menu options, and special seasonal rates directly on WhatsApp."
  },

  // 2. WESTLANDS EXECUTIVE CHAUFFEUR & SAFARI HIRE (NAIROBI)
  {
    slug: "westlands-executive-chauffeur-safari-hire-nairobi",
    name: "Westlands Executive Chauffeur & Safari Hire",
    niche: "Executive Chauffeur & Land Cruiser Prado Car Hire",
    city: "Nairobi",
    address: "Mpaka Road, Westlands, Nairobi",
    phone: "+254721889900",
    rating: 4.8,
    reviewsCount: 62,
    accentColor: "#D97706",
    accentHover: "#B45309",
    accentLight: "#FEF3C7",
    accentBorder: "#FDE68A",
    badgeText: "Diplomatic & Corporate Certified Fleet",
    fontImport: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    headingFont: "'Space Grotesk', sans-serif",
    heroHeadline: "Armored Comfort & Overland Precision for",
    heroHighlight: "Executives & VIP Expeditions",
    heroSubtitle: "Nairobi's premier fleet of Toyota Land Cruiser Prado TX, V8s, Mercedes-Benz S-Class, and custom pop-up safari cruisers with close-protection trained drivers.",
    heroImage: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Executive 4x4 Fleet in Westlands",
    imageBadge: "GPS Tracked Fleet",
    whyChooseUs: [
      { title: "Security-Trained Drivers", desc: "Discreet, vetted professional chauffeurs trained in defensive driving and VIP executive protocol.", icon: "shield" },
      { title: "Immaculate Modern Fleet", desc: "Late-model Land Cruisers and sedans with onboard Wi-Fi, chilled water, and device charging.", icon: "car" },
      { title: "Transparent Daily Rates", desc: "Zero hidden charges. Fuel, insurance, driver allowances, and mileage clearly outlined.", icon: "dollar-sign" }
    ],
    services: [
      {
        title: "Toyota Land Cruiser Prado TX",
        desc: "The standard in executive travel for Nairobi corporate meetings, county travel, and site inspections.",
        bullets: ["7-Seater premium leather interior", "Full-time 4WD offroad capability", "From KES 15,000 / day with driver"],
        icon: "crosshair",
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"
      },
      {
        title: "Pop-Up 4x4 Safari Cruiser",
        desc: "Custom heavy-duty overland Land Cruiser fully rigged for national parks and wildlife photography.",
        bullets: ["Pop-up game viewing roof", "High-lift jacks & dual spares", "From KES 22,000 / day with driver-guide"],
        icon: "camera",
        image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800"
      },
      {
        title: "JKIA VIP Fast-Track & Airport",
        desc: "Curbside airport reception with luggage assistance, flight delay tracking, and priority transit.",
        bullets: ["Meet & greet at arrival terminal", "Direct transfer to any Nairobi hotel", "Chilled refreshments included"],
        icon: "plane",
        image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800"
      }
    ],
    testimonials: [
      { quote: "Flawless service during our UN delegation in Nairobi. Professional drivers, immaculate Land Cruisers, and punctual airport transfers throughout.", author: "David Henderson", role: "Visiting Diplomat" },
      { quote: "Hired two pop-up Land Cruisers for our family safari to Masai Mara. Smooth ride, knowledgeable driver-guide, and transparent pricing.", author: "Samir Patel", role: "Corporate Client" }
    ],
    hours: { weekday: "Dispatch: 24/7 Hotline", saturday: "Dispatch: 24/7 Hotline", sunday: "Dispatch: 24/7 Hotline" },
    ctaBannerTitle: "Reserve Your Executive Chauffeur Today",
    ctaBannerSubtitle: "Send your itinerary on WhatsApp for instant confirmation and dedicated vehicle allocation."
  },

  // 3. KAREN RIDGE SPINE & SPORTS PHYSIOTHERAPY (NAIROBI)
  {
    slug: "karen-ridge-spine-sports-physiotherapy-nairobi",
    name: "Karen Ridge Spine & Sports Physiotherapy",
    niche: "Specialized Physiotherapy & Sports Rehabilitation Clinic",
    city: "Nairobi",
    address: "Karen Plains Road, Karen, Nairobi",
    phone: "+254723112244",
    rating: 4.9,
    reviewsCount: 47,
    accentColor: "#15803D",
    accentHover: "#166534",
    accentLight: "#DCFCE7",
    accentBorder: "#BBF7D0",
    badgeText: "Physiotherapy Council of Kenya Registered",
    fontImport: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    headingFont: "'Lora', serif",
    heroHeadline: "Reclaim Freedom of Movement &",
    heroHighlight: "Live Free from Chronic Pain",
    heroSubtitle: "Evidence-based spine decompression, post-surgical recovery, sports injury rehabilitation, and bespoke ergonomic care in a private Karen clinic.",
    heroImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Physiotherapy Clinic in Karen",
    imageBadge: "Clinical Wellness",
    whyChooseUs: [
      { title: "Individualized Care Plans", desc: "1-on-1 dedicated clinical sessions. We never double-book or rush your rehabilitation process.", icon: "user-check" },
      { title: "Advanced Modalities", desc: "Electrotherapy, dry needling, spinal mobilization, and progressive biomechanical retraining.", icon: "activity" },
      { title: "Karen Mobile Visits", desc: "Discreet in-home physiotherapy visits for post-operative recovery and elderly residents in Karen.", icon: "home" }
    ],
    services: [
      { title: "Spine & Sciatica Therapy", desc: "Non-surgical decompression, postural realignment, and core stabilization for chronic back and neck pain.", bullets: ["Herniated disc management", "Sciatica nerve pain relief", "Ergonomic workspace assessment"], icon: "align-justify" },
      { title: "Sports Rehabilitation", desc: "Accelerated return-to-play programs for golfers, runners, gym athletes, and racquet sports.", bullets: ["Ligament & tendon rehab (ACL/MCL)", "Rotator cuff shoulder therapy", "Biomechanical gait analysis"], icon: "target" },
      { title: "Post-Surgical Recovery", desc: "Step-by-step mobility restoration following knee/hip replacements and orthopedic procedures.", bullets: ["Swelling & scar tissue therapy", "Range of motion restoration", "Home exercise protocols"], icon: "heart-pulse" }
    ],
    testimonials: [
      { quote: "Suffered from debilitating lower back pain for 6 months. Within 4 sessions at Karen Ridge, I was back on the Karen Golf Course pain-free!", author: "Patrick K.", role: "Karen Resident" },
      { quote: "Exceptional clinical care. The therapists take time to explain anatomy and craft realistic recovery exercises that actually work.", author: "Dr. Catherine O.", role: "Consultant Physician" }
    ],
    hours: { weekday: "7:30 AM - 6:30 PM", saturday: "8:00 AM - 3:00 PM", sunday: "By Appointment Only" },
    ctaBannerTitle: "Schedule Your Comprehensive Spine Assessment",
    ctaBannerSubtitle: "Speak with a licensed senior physiotherapist on WhatsApp to find the soonest available slot."
  },

  // 4. KILIMANI ORTHOPEDIC & JOINT CARE (NAIROBI)
  {
    slug: "kilimani-orthopedic-joint-care-nairobi",
    name: "Kilimani Orthopedic & Joint Care Centre",
    niche: "Orthopedic Surgery & Joint Pain Consultation",
    city: "Nairobi",
    address: "Argwings Kodhek Road, Kilimani, Nairobi",
    phone: "+254724335577",
    rating: 4.8,
    reviewsCount: 39,
    accentColor: "#0284C7",
    accentHover: "#0369A1",
    accentLight: "#E0F2FE",
    accentBorder: "#BAE6FD",
    badgeText: "Board-Certified Orthopedic Surgeons",
    fontImport: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    headingFont: "'Plus Jakarta Sans', sans-serif",
    heroHeadline: "World-Class Joint Replacement &",
    heroHighlight: "Minimally Invasive Surgery",
    heroSubtitle: "Modern outpatient orthopedic clinic delivering compassionate surgical consultations, knee & hip arthroscopy, PRP injections, and trauma care in Kilimani.",
    heroImage: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Orthopedic Surgeon in Kilimani",
    imageBadge: "Kilimani Clinic",
    whyChooseUs: [
      { title: "Fellowship-Trained Specialists", desc: "Senior surgeons affiliated with top Nairobi hospitals for joint preservation and replacements.", icon: "award" },
      { title: "Rapid Digital Diagnostics", desc: "On-site digital X-ray, joint aspiration, and fast ultrasound imaging to diagnose without delays.", icon: "file-text" },
      { title: "Direct WhatsApp Booking", desc: "Avoid crowded waiting rooms. Instant consultation scheduling with transparent fees.", icon: "clock" }
    ],
    services: [
      { title: "Knee & Shoulder Arthroscopy", desc: "Minimally invasive keyhole surgery for meniscus tears, ACL reconstruction, and rotator cuff repairs.", bullets: ["Minimal postoperative scarring", "Same-day or next-day discharge", "Rapid return to activity"], icon: "scissors" },
      { title: "Joint Preservation & PRP Injections", desc: "Platelet-rich plasma therapy and hyaluronic acid injections for early-stage osteoarthritis.", bullets: ["Cartilage regeneration support", "Long-lasting pain reduction", "In-clinic 30-minute procedure"], icon: "droplet" },
      { title: "Fracture & Trauma Clinic", desc: "Immediate diagnostic assessment and lightweight waterproof casting for sports and accident fractures.", bullets: ["Digital X-ray imaging", "Modern synthetic splints", "Orthopedic follow-up care"], icon: "shield-alert" }
    ],
    testimonials: [
      { quote: "Dr. and the team at Kilimani Orthopedic guided me through my knee arthroscopy with immense empathy and technical skill. Walking comfortably within days!", author: "Grace Nyambura", role: "Kilimani Patient" },
      { quote: "Modern clinic, zero waiting room delays, and super responsive WhatsApp appointment reminders. Highly recommended.", author: "Ahmed Al-Mansoor", role: "Patient" }
    ],
    hours: { weekday: "8:00 AM - 6:00 PM", saturday: "9:00 AM - 2:00 PM", sunday: "Emergency On-Call" },
    ctaBannerTitle: "Consult with a Joint Specialist Today",
    ctaBannerSubtitle: "Book an orthopedic consultation via WhatsApp for expert diagnosis and treatment planning."
  },

  // 5. LAVINGTON PRIME ARCHITECTURAL & INTERIOR STUDIO (NAIROBI)
  {
    slug: "lavington-prime-architectural-interior-design-nairobi",
    name: "Lavington Prime Architectural & Interior Studio",
    niche: "Boutique Architectural & Luxury Interior Architecture",
    city: "Nairobi",
    address: "James Gichuru Road, Lavington, Nairobi",
    phone: "+254725446688",
    rating: 4.9,
    reviewsCount: 33,
    accentColor: "#9A3412",
    accentHover: "#7C2D12",
    accentLight: "#FFEDD5",
    accentBorder: "#FED7AA",
    badgeText: "BORAQS Registered Architects",
    fontImport: "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    headingFont: "'Cinzel', serif",
    heroHeadline: "Bespoke Modern Architecture &",
    heroHighlight: "Timeless Interior Living",
    heroSubtitle: "Award-winning design practice specializing in bespoke luxury residences, high-end commercial office fit-outs, and boutique hospitality interiors across Nairobi.",
    heroImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Interior Design Studio in Lavington",
    imageBadge: "Lavington Studio",
    whyChooseUs: [
      { title: "BORAQS Certified Practice", desc: "Fully accredited architectural and quantity surveying team meeting rigorous Kenyan national building standards.", icon: "award" },
      { title: "Fast-Track County Approvals", desc: "Seamless navigation of Nairobi City County building permits, structural validations, and NEMA licenses.", icon: "check-circle" },
      { title: "Turnkey Accountability", desc: "A single accountable partner from raw ground-breaking to luxury interior handover with zero contractor friction.", icon: "shield-check" }
    ],
    services: [
      {
        title: "Turnkey Project Execution",
        desc: "From concept sketches and council approvals to structural engineering and final decor hand-off.",
        bullets: [
          "End-to-end site management & contractor oversight",
          "Nairobi County & NEMA statutory approvals",
          "Complete turnkey hand-off ready for immediate occupation"
        ],
        icon: "check-square",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"
      },
      {
        title: "3D Photorealistic Previews",
        desc: "Experience your home in immersive 3D walkthroughs and VR before laying a single foundation stone.",
        bullets: [
          "Cinematic 3D interior & exterior VR walkthroughs",
          "Natural daylight simulation & solar orientation studies",
          "Photorealistic material texture and finishes visualization"
        ],
        icon: "eye",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800"
      },
      {
        title: "Rigorous Cost Engineering",
        desc: "Transparent BOQs and contractor oversight ensuring projects finish on time and on budget.",
        bullets: [
          "Detailed Bills of Quantities (BOQ) with zero hidden items",
          "Competitive contractor vetting & material audit",
          "Milestone-based stage valuations & disciplined disbursement"
        ],
        icon: "bar-chart-2",
        image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800"
      }
    ],
    testimonials: [
      { quote: "Lavington Prime transformed our duplex into an architectural masterpiece. Flawless spatial planning and project management from day one.", author: "Ken & Sheila M.", role: "Homeowners" },
      { quote: "Their design increased our boutique commercial space rental yield significantly. Exceptional aesthetic vision and execution.", author: "Farhan Hirji", role: "Property Developer" }
    ],
    hours: { weekday: "8:30 AM - 5:30 PM", saturday: "9:00 AM - 1:00 PM", sunday: "Closed" },
    ctaBannerTitle: "Commission Your Architectural Project",
    ctaBannerSubtitle: "Share your plot or renovation ideas on WhatsApp to schedule an initial design consultation."
  },

  // 6. SOLARKRAFT COMMERCIAL SOLAR & BACKUP SYSTEMS (NAIROBI)
  {
    slug: "solarkraft-commercial-backup-energy-nairobi",
    name: "Solarkraft Commercial Solar & Backup Systems",
    niche: "Commercial Solar Energy & Lithium Battery Backup",
    city: "Nairobi",
    address: "Enterprise Road, Industrial Area, Nairobi",
    phone: "+254726557799",
    rating: 4.8,
    reviewsCount: 58,
    accentColor: "#0284C7",
    accentHover: "#0369A1",
    accentLight: "#E0F2FE",
    accentBorder: "#BAE6FD",
    badgeText: "EPRA Class V1 Solar Licensed Contractor",
    fontImport: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    headingFont: "'Plus Jakarta Sans', sans-serif",
    heroHeadline: "Eliminate Factory Blackouts &",
    heroHighlight: "Cut Power Bills up to 70%",
    heroSubtitle: "Engineered commercial rooftop solar photovoltaic installations and zero-millisecond lithium-ion microgrids for manufacturing plants, hospitals, and commercial facilities.",
    heroImage: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Commercial Solar Installation",
    imageBadge: "Industrial Solar",
    whyChooseUs: [
      { title: "Tier-1 Hardware Only", desc: "Top-tier monocrystalline solar panels with 25-year performance warranties and industrial smart inverters.", icon: "sun" },
      { title: "Zero Downtime UPS Cutover", desc: "LiFePO4 battery banks cut in within 0 milliseconds, protecting sensitive machinery from grid dips.", icon: "zap" },
      { title: "EPRA Regulatory Compliance", desc: "Fully certified engineering drawings, grid connection clearance, and energy audit approvals.", icon: "file-check" }
    ],
    services: [
      { title: "Commercial Grid-Tie Solar PV", desc: "Direct solar power generation during high daytime tariff hours, cutting monthly KPLC bills drastically.", bullets: ["50kW to 2MW commercial scale", "Net metering compatibility", "25-year linear power warranty"], icon: "sun" },
      { title: "Lithium Microgrid & ESS", desc: "High-capacity lithium battery energy storage systems replacing noisy, high-maintenance diesel generators.", bullets: ["LiFePO4 6000+ cycle lifespan", "Instant automated switchover", "Smart remote cloud telemetry"], icon: "battery-charging" },
      { title: "Energy Audit & Feasibility", desc: "Detailed 14-day data-logger load analysis projecting payback schedules, ROI metrics, and CAPEX.", bullets: ["Comprehensive tariff breakdown", "Asset financing options", "Carbon offset certification"], icon: "trending-up" }
    ],
    testimonials: [
      { quote: "Solarkraft installed a 120kWp solar hybrid plant on our pharmaceutical warehouse. Our monthly utility bill slashed by 65% with zero outages.", author: "Eng. Moses Kariuki", role: "Operations Director" },
      { quote: "Zero downtime during national power blackouts. The lithium battery banks switch over instantaneously. Solid engineering.", author: "Vikram Shah", role: "Plant Manager" }
    ],
    hours: { weekday: "8:00 AM - 5:30 PM", saturday: "8:30 AM - 1:00 PM", sunday: "Emergency Support 24/7" },
    ctaBannerTitle: "Get a Free Solar Feasibility Quote",
    ctaBannerSubtitle: "Send a photo of your monthly electricity bill on WhatsApp for an immediate solar savings estimate."
  },

  // 7. THE GRAND PAVILION LUXURY GROUNDS (TIGONI / LIMURU)
  {
    slug: "the-grand-pavilion-luxury-wedding-grounds-tigoni",
    name: "The Grand Pavilion Luxury Grounds",
    niche: "Exclusive Garden Wedding & Corporate Gala Retreat",
    city: "Nairobi",
    address: "Tigoni Tea Country, Limuru Road, Nairobi",
    phone: "+254727668800",
    rating: 4.9,
    reviewsCount: 71,
    accentColor: "#4D7C0F",
    accentHover: "#3F6212",
    accentLight: "#ECFCCB",
    accentBorder: "#D9F99D",
    badgeText: "Voted Kenya's Top Tea Estate Wedding Venue",
    fontImport: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    headingFont: "'Cormorant Garamond', serif",
    heroHeadline: "A Fairytale Tea Country Setting for",
    heroHighlight: "Unforgettable Wedding Vows",
    heroSubtitle: "10 acres of manicured emerald lawns surrounded by cool mist, rolling tea plantations, and century-old indigenous trees. Accommodates up to 1,200 guests.",
    heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Wedding Venue in Tigoni",
    imageBadge: "Tea Country Vistas",
    whyChooseUs: [
      { title: "Spectacular Photography Grounds", desc: "Private access to rolling green tea fields, botanical floral arches, and scenic golden-hour vistas.", icon: "camera" },
      { title: "VIP Bridal Dressing Chalets", desc: "Luxurious ensuite dressing suites with full vanity stations, lounge seating, and champagne bar.", icon: "heart" },
      { title: "Seamless All-Weather Logistics", desc: "Paved access roads, secure parking for 400+ vehicles, modern luxury executive washrooms, and helipad.", icon: "check-circle" }
    ],
    services: [
      { title: "Garden Wedding Ceremonies", desc: "Manicured main lawns accommodating large marquee domes, banquet dining, and dancing under the stars.", bullets: ["Capacity from 200 to 1,200 guests", "All-day exclusive venue access", "Outdoor ceremony gazebos"], icon: "users" },
      { title: "Executive Corporate Retreats", desc: "Fresh highland air, outdoor breakout pavilions, fast Wi-Fi, and open spaces for leadership team building.", bullets: ["Audio-visual stage setups", "Executive catering space", "Helipad landing clearance"], icon: "briefcase" },
      { title: "Engagement & Bridal Photography", desc: "Dedicated access for pre-wedding photo sessions, video shoots, and intimate vow renewals.", bullets: ["Golden hour tea estate access", "Dressing room access", "Security team support"], icon: "image" }
    ],
    testimonials: [
      { quote: "The most picturesque wedding grounds in Kenya. The tea field backdrop during golden hour gave us fairytale photos that our guests still talk about!", author: "Sharon & Brian", role: "Newlyweds" },
      { quote: "Hosted our 300-delegate annual gala here. Seamless logistics, beautiful greenery, and very helpful on-site management.", author: "Linda Muthoni", role: "Corporate Events Lead" }
    ],
    hours: { weekday: "Venue Tours: 9:00 AM - 5:00 PM", saturday: "Events & Tours: 8:00 AM - 6:00 PM", sunday: "Events: 8:00 AM - 6:00 PM" },
    ctaBannerTitle: "Book a Private Grounds Walkthrough",
    ctaBannerSubtitle: "Check open wedding and event dates on WhatsApp and schedule an in-person tour of the tea estate."
  },

  // 8. UPPER HILL CORPORATE LEGAL & NOTARY (NAIROBI)
  {
    slug: "upper-hill-corporate-legal-notary-nairobi",
    name: "Upper Hill Corporate Legal & Notary",
    niche: "Corporate Commercial Law & Conveyancing Notary",
    city: "Nairobi",
    address: "Hospital Road, Upper Hill Financial District, Nairobi",
    phone: "+254728779911",
    rating: 4.8,
    reviewsCount: 41,
    accentColor: "#1E3A8A",
    accentHover: "#1E40AF",
    accentLight: "#DBEAFE",
    accentBorder: "#BFDBFE",
    badgeText: "Law Society of Kenya Accredited Advocates",
    fontImport: "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    headingFont: "'Cinzel', serif",
    heroHeadline: "Decisive Corporate Legal Counsel &",
    heroHighlight: "Same-Day Notary Public",
    heroSubtitle: "Trusted legal partners in Nairobi's financial district. Comprehensive company structuring, land conveyance, commercial contracts, and fast document notarization.",
    heroImage: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Corporate Law Office in Upper Hill",
    imageBadge: "Upper Hill Chambers",
    whyChooseUs: [
      { title: "Senior Commercial Advocates", desc: "Decades of combined transactional experience in Kenyan corporate, real estate, and finance law.", icon: "award" },
      { title: "Same-Day Express Notarization", desc: "Walk-in and appointment notary attestation for international tenders, affidavits, and powers of attorney.", icon: "file-text" },
      { title: "Transparent Retainer Pricing", desc: "Clear fee structures compliant with the Advocates Remuneration Order without hidden disbursements.", icon: "dollar-sign" }
    ],
    services: [
      { title: "Corporate & Commercial Law", desc: "Company formation, shareholder agreements, mergers, intellectual property, and regulatory compliance.", bullets: ["Joint venture agreements", "Employment & vendor contracts", "Fintech licensing compliance"], icon: "briefcase" },
      { title: "Real Estate & Conveyancing", desc: "Rigorous due diligence, land registry search verification, sectional property transfers, and commercial leases.", bullets: ["Title deed transfer processing", "Commercial leasing agreements", "Mortgage & charge documentation"], icon: "home" },
      { title: "Notary Public & Attestation", desc: "Official verification, apostilles, sworn affidavits, statutory declarations, and international powers of attorney.", bullets: ["Same-day document certification", "Embassy & consular authentications", "Certified true copies of passports"], icon: "check-circle" }
    ],
    testimonials: [
      { quote: "Handled our cross-border commercial joint venture with precision and speed. The best corporate legal counsel in Upper Hill.", author: "Antony Otieno", role: "Managing Director" },
      { quote: "Needed emergency notary certification for international tenders. Done within 30 minutes! Highly professional advocates.", author: "Beatrice W.", role: "Finance Director" }
    ],
    hours: { weekday: "8:00 AM - 5:30 PM", saturday: "9:00 AM - 1:00 PM (Notary Only)", sunday: "Closed" },
    ctaBannerTitle: "Consult with a Corporate Advocate",
    ctaBannerSubtitle: "Book a legal consultation or urgent notary appointment directly on WhatsApp."
  }
];

function generateFullWhiteModeHtml(demo: DemoConfig): string {
  const cleanPhone = demo.phone.replace(/\D/g, "");
  const whatsappBookingUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${demo.name}, I found your website and would like to book an appointment / inquire about services.`)}`;

  const whyChooseUsHtml = demo.whyChooseUs.map(item => `
    <div class="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style="background-color: ${demo.accentLight}; color: ${demo.accentColor}">
        <i data-lucide="${item.icon}" class="w-6 h-6"></i>
      </div>
      <h3 class="text-xl font-bold text-slate-900 mb-3">${item.title}</h3>
      <p class="text-slate-600 text-sm leading-relaxed">${item.desc}</p>
    </div>
  `).join("");

  const servicesHtml = demo.services.map(s => `
    <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      ${s.image ? `
      <div class="w-full aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100 relative">
        <img src="${s.image}" alt="${s.title}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
        <div class="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
          ${demo.name.includes("Car") || demo.name.includes("Chauffeur") ? "Verified Vehicle" : demo.name.includes("Architectural") ? "Core Capability" : "Featured"}
        </div>
      </div>
      ` : ""}
      <div class="p-6 sm:p-8 space-y-4 flex-1 flex flex-col justify-between">
        <div class="space-y-3">
          ${!s.image ? `
          <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background-color: ${demo.accentLight}; color: ${demo.accentColor}">
            <i data-lucide="${s.icon}" class="w-6 h-6"></i>
          </div>
          ` : ""}
          <h3 class="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">${s.title}</h3>
          <p class="text-slate-600 text-xs sm:text-sm leading-relaxed">${s.desc}</p>
          <ul class="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
            ${s.bullets.map(b => `<li class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-600 shrink-0"></i><span class="leading-tight">${b}</span></li>`).join("")}
          </ul>
        </div>
        <div class="pt-4 mt-4 border-t border-slate-100">
          <a href="${whatsappBookingUrl}" target="_blank" class="inline-flex items-center gap-2 font-bold text-xs sm:text-sm hover:underline" style="color: ${demo.accentColor}">
            <span>Book via WhatsApp</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      </div>
    </div>
  `).join("");

  const testimonialsHtml = demo.testimonials.map(t => `
    <div class="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative space-y-4">
      <div class="flex items-center gap-1 text-amber-500">
        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
        <i data-lucide="star" class="w-4 h-4 fill-current"></i>
      </div>
      <p class="text-slate-700 italic text-base leading-relaxed">"${t.quote}"</p>
      <div class="pt-4 border-t border-slate-100 flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style="background-color: ${demo.accentColor}">
          ${t.author.charAt(0)}
        </div>
        <div>
          <div class="font-bold text-slate-900 text-sm">${t.author}</div>
          <div class="text-xs text-slate-500">${t.role}</div>
        </div>
      </div>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth overflow-x-hidden w-full max-w-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${demo.name} | ${demo.city}, Kenya</title>
  <meta name="description" content="${demo.heroSubtitle}">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${demo.fontImport}" rel="stylesheet">
  <style>
    *, ::before, ::after { box-sizing: border-box; }
    html, body { max-width: 100vw; overflow-x: hidden; width: 100%; margin: 0; padding: 0; }
    h1, h2, h3, .font-heading { font-family: ${demo.headingFont}; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-white text-slate-900 antialiased overflow-x-hidden w-full max-w-full selection:bg-slate-900 selection:text-white pb-24">

  <!-- Floating Mobile WhatsApp Quick Button -->
  <a href="${whatsappBookingUrl}" 
     target="_blank" 
     rel="noopener noreferrer" 
     class="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 sm:py-3.5 sm:px-6 rounded-full shadow-2xl shadow-emerald-600/50 hover:scale-105 transition-all text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-emerald-400">
    <i data-lucide="message-circle" class="w-5 h-5 fill-current"></i>
    <span class="tracking-wide">Book via WhatsApp</span>
  </a>

  <!-- Top Emergency / Direct Line Bar -->
  <div class="bg-slate-900 text-slate-300 text-[11px] sm:text-xs py-2 px-4 w-full overflow-hidden">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1.5 text-center sm:text-left">
      <div class="flex items-center justify-center gap-1.5 truncate max-w-full">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
        <span class="font-medium truncate">${demo.address}</span>
      </div>
      <div class="flex items-center justify-center gap-3 sm:gap-4 text-[11px]">
        <a href="tel:${cleanPhone}" class="hover:text-white font-semibold flex items-center gap-1 shrink-0">
          <i data-lucide="phone" class="w-3 h-3"></i>
          <span>${demo.phone}</span>
        </a>
        <a href="${whatsappBookingUrl}" target="_blank" class="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 shrink-0">
          <i data-lucide="message-circle" class="w-3 h-3 fill-current"></i>
          <span>WhatsApp Available</span>
        </a>
      </div>
    </div>
  </div>

  <!-- Navigation Bar -->
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 w-full overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
      <a href="#" class="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-none">
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-lg sm:text-xl text-white shadow-md shrink-0" style="background-color: ${demo.accentColor}">
          ${demo.name.charAt(0)}
        </div>
        <div class="min-w-0">
          <span class="block font-black text-sm sm:text-base md:text-lg text-slate-900 leading-tight truncate">${demo.name}</span>
          <span class="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate" style="color: ${demo.accentColor}">${demo.niche}</span>
        </div>
      </a>

      <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 shrink-0">
        <a href="#services" class="hover:text-slate-900 transition-colors">Services</a>
        <a href="#why-us" class="hover:text-slate-900 transition-colors">Why Choose Us</a>
        <a href="#reviews" class="hover:text-slate-900 transition-colors">Client Reviews</a>
        <a href="#contact" class="hover:text-slate-900 transition-colors">Location & Hours</a>
      </nav>

      <div class="flex items-center gap-2 shrink-0">
        <a href="${whatsappBookingUrl}" target="_blank" class="sm:hidden w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shrink-0" aria-label="Book on WhatsApp">
          <i data-lucide="message-circle" class="w-4 h-4 fill-current"></i>
        </a>
        <a href="${whatsappBookingUrl}" target="_blank" class="hidden sm:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm shadow-md hover:scale-105 transition-all shrink-0">
          <i data-lucide="message-circle" class="w-4 h-4 fill-current"></i>
          <span>Book via WhatsApp</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="py-10 sm:py-16 lg:py-24 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-100 w-full overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
        
        <!-- Left Content -->
        <div class="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left w-full min-w-0">
          <div class="inline-flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-2xl sm:rounded-full text-[11px] sm:text-xs font-bold border max-w-full" style="background-color: ${demo.accentLight}; color: ${demo.accentColor}; border-color: ${demo.accentBorder}">
            <i data-lucide="award" class="w-3.5 h-3.5 shrink-0"></i>
            <span>${demo.badgeText}</span>
            <span class="hidden sm:inline text-slate-300">•</span>
            <span class="text-amber-600 flex items-center gap-0.5 font-extrabold">★ ${demo.rating} (${demo.reviewsCount}+ Reviews)</span>
          </div>

          <h1 class="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight break-words max-w-full">
            ${demo.heroHeadline} <span style="color: ${demo.accentColor}">${demo.heroHighlight}</span>
          </h1>

          <p class="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
            ${demo.heroSubtitle}
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 w-full">
            <a href="${whatsappBookingUrl}" target="_blank" class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm sm:text-base shadow-xl shadow-emerald-600/30 hover:scale-105 transition-all">
              <i data-lucide="message-circle" class="w-5 h-5 fill-current"></i>
              <span>Book Appointment on WhatsApp</span>
            </a>
            <a href="#services" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm sm:text-base shadow-sm transition-all">
              <span>View Services</span>
              <i data-lucide="arrow-down" class="w-4 h-4"></i>
            </a>
          </div>

          <div class="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-500 font-medium">
            <div class="flex items-center gap-1.5 truncate max-w-full">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
              <span class="truncate">${demo.address}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
              <span>Prompt Service</span>
            </div>
          </div>
        </div>

        <!-- Right Hero Image Card -->
        <div class="lg:col-span-5 relative w-full">
          <div class="rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] bg-slate-100 relative max-w-md mx-auto lg:max-w-none">
            <img src="${demo.heroImage}" alt="${demo.imageAlt}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
            <div class="absolute bottom-5 left-5 right-5 text-white space-y-1">
              <span class="inline-block bg-white text-slate-900 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">${demo.imageBadge}</span>
              <div class="text-lg sm:text-xl font-bold leading-tight">${demo.name}</div>
              <div class="text-xs text-slate-200">⭐ ${demo.rating}★ on Google (${demo.reviewsCount} verified reviews)</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- Section 2: Why Choose Us -->
  <section id="why-us" class="py-20 bg-slate-50 border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <h2 class="text-xs font-extrabold uppercase tracking-widest" style="color: ${demo.accentColor}">Excellence Guaranteed</h2>
        <p class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Why Choose ${demo.name}</p>
        <p class="text-slate-600 text-base">Setting the benchmark for professionalism, reliability, and client satisfaction in ${demo.city}.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        ${whyChooseUsHtml}
      </div>
    </div>
  </section>

  <!-- Section 3: Detailed Services Grid -->
  <section id="services" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <h2 class="text-xs font-extrabold uppercase tracking-widest" style="color: ${demo.accentColor}">Tailored Capabilities</h2>
        <p class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Our Core Services</p>
        <p class="text-slate-600 text-base">Comprehensive packages designed around your exact needs with transparent pricing.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        ${servicesHtml}
      </div>
    </div>
  </section>

  <!-- Section 4: Social Proof / Testimonials -->
  <section id="reviews" class="py-20 bg-slate-50 border-y border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <h2 class="text-xs font-extrabold uppercase tracking-widest" style="color: ${demo.accentColor}">Client Feedback</h2>
        <p class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Trusted by Clients Across Kenya</p>
        <p class="text-slate-600 text-base">Real experiences from verified clients who rely on ${demo.name}.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        ${testimonialsHtml}
      </div>
    </div>
  </section>

  <!-- Section 5: Location, Operating Hours & Contact Table -->
  <section id="contact" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        <div class="lg:col-span-6 space-y-6">
          <h2 class="text-xs font-extrabold uppercase tracking-widest" style="color: ${demo.accentColor}">Convenient Access</h2>
          <p class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Operating Hours & Location</p>
          <p class="text-slate-600 text-base leading-relaxed">
            Visit us in ${demo.city} or connect directly through WhatsApp for immediate consultation, booking, and quotes.
          </p>

          <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
            <div class="flex justify-between items-center pb-3 border-b border-slate-200 text-sm">
              <span class="font-bold text-slate-700">Monday - Friday</span>
              <span class="font-semibold text-slate-900">${demo.hours.weekday}</span>
            </div>
            <div class="flex justify-between items-center pb-3 border-b border-slate-200 text-sm">
              <span class="font-bold text-slate-700">Saturday</span>
              <span class="font-semibold text-slate-900">${demo.hours.saturday}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="font-bold text-slate-700">Sunday</span>
              <span class="font-semibold text-slate-900">${demo.hours.sunday}</span>
            </div>
          </div>

          <div class="space-y-3 pt-2 text-sm text-slate-600">
            <div class="flex items-center gap-3">
              <i data-lucide="map-pin" class="w-5 h-5 text-slate-400"></i>
              <span>${demo.address}</span>
            </div>
            <div class="flex items-center gap-3">
              <i data-lucide="phone" class="w-5 h-5 text-slate-400"></i>
              <span>${demo.phone}</span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-6">
          <div class="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-6 shadow-sm">
            <div class="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <i data-lucide="message-circle" class="w-6 h-6 fill-current"></i>
              </div>
              <div>
                <h4 class="font-bold text-slate-900 text-lg">Instant WhatsApp Desk</h4>
                <p class="text-xs text-slate-500">Fastest response times for consultations & quotes</p>
              </div>
            </div>
            <p class="text-slate-600 text-sm leading-relaxed">
              Have questions regarding availability, custom pricing, or service specifications? Our team is available on WhatsApp right now.
            </p>
            <a href="${whatsappBookingUrl}" target="_blank" class="w-full inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 px-8 rounded-2xl text-base shadow-xl shadow-emerald-600/30 hover:scale-105 transition-all">
              <i data-lucide="message-circle" class="w-5 h-5 fill-current"></i>
              <span>Start WhatsApp Conversation</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- Section 6: High-Conversion CTA Banner -->
  <section class="py-16 text-white relative overflow-hidden" style="background-color: ${demo.accentColor}">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
      <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white">${demo.ctaBannerTitle}</h2>
      <p class="text-white/90 max-w-2xl mx-auto text-base sm:text-lg font-normal">
        ${demo.ctaBannerSubtitle}
      </p>
      <div class="pt-2">
        <a href="${whatsappBookingUrl}" target="_blank" class="inline-flex items-center gap-3 bg-white text-slate-900 hover:bg-slate-100 font-extrabold px-10 py-4 rounded-full text-base shadow-2xl hover:scale-105 transition-all">
          <i data-lucide="message-circle" class="w-5 h-5 text-emerald-600 fill-current"></i>
          <span>Chat on WhatsApp Now</span>
        </a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-slate-900 text-slate-400 py-16 text-sm border-t border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-white" style="background-color: ${demo.accentColor}">
            ${demo.name.charAt(0)}
          </div>
          <div>
            <div class="font-bold text-white text-base">${demo.name}</div>
            <div class="text-xs text-slate-400">${demo.niche}</div>
          </div>
        </div>
        <div class="text-center sm:text-right text-xs space-y-1">
          <div class="text-white font-medium">📍 ${demo.address}</div>
          <div class="text-slate-400">📞 ${demo.phone}</div>
        </div>
      </div>
      <div class="text-center text-xs text-slate-500">
        &copy; ${new Date().getFullYear()} ${demo.name}. All rights reserved. Professional web demo showcase.
      </div>
    </div>
  </footer>

  <script>lucide.createIcons();</script>
</body>
</html>`;
}

for (const demo of DEMOS) {
  const html = generateFullWhiteModeHtml(demo);
  saveDemo(demo.slug, html);
}
console.log("\n🎉 All 8 demos re-generated with rich content & clean white mode!");
