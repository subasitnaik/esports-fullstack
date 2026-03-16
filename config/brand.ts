/**
 * BRAND CONFIG - Template Customization
 * =====================================
 * Edit this single file to customize your app's name, copy, colors, and links
 * for the website. (Kept in website folder for Vercel deployment.)
 */

export const brand = {
  /** App name - used in headers, titles, footer */
  appName: "Your Name Esports",

  /** Social links - shown in navbar (set to empty string "" to hide) */
  social: {
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
  },

  /** Image paths - place files in website/public/images/ */
  images: {
    homepageBackground: "/images/home-page-bg.jpg",
  },

  /** Short tagline for hero section */
  tagline: "Compete. Connect. Conquer.",

  /** Hero section */
  hero: {
    titleAccent: "THE BEST",
    titleMain: "ESPORTS APP",
    subtitle: "Compete. Connect. Conquer.",
  },

  /** About section */
  about: {
    title: "About the App",
    paragraph1:
      "Esports App is your all-in-one hub for competitive gaming. Whether you're a casual player looking to join local tournaments or a seasoned pro tracking your climb through the ranks, we've got you covered.",
    paragraph2:
      "Discover upcoming tournaments across your favorite games, get real-time match updates, connect with teammates and rivals, and showcase your achievements. Our platform brings the entire esports ecosystem together in one place—so you can focus on what matters most: the game.",
    features: [
      "Tournament discovery and registration",
      "Live match tracking and notifications",
      "Community features and team building",
      "Player profiles and stats",
    ],
  },

  /** Games - shown in games carousel. Add bgmi_image.*, freefire_image.*, cod_image.* to public/images/ */
  games: [
    { name: "BGMI", slug: "bgmi", image: "/images/bgmi_image" },
    { name: "Free Fire", slug: "free-fire", image: "/images/freefire_image" },
    { name: "COD", slug: "cod", image: "/images/cod_image" },
  ],

  /** Stats section - "Constantly Growing" numbers */
  stats: {
    title: "Constantly Growing",
    subtitle: "Providing the best Esports experience to millions of aspiring gamers.",
    items: [
      { value: "6.1M+", label: "Total Gamers" },
      { value: "120K+", label: "Matches Played" },
      { value: "10M+", label: "Leagues Joined" },
      { value: "100M+", label: "Winning Distributed" },
    ],
  },

  /** Why Download section */
  whyDownload: {
    title: "Why Download",
    /** Use {appName} as placeholder - replaced at runtime */
    description:
      "{appName} has been made for gamers to start and build their journey as a gamer and eventually become pro Esports athletes!",
  },

  /** Get App section - download CTA with features */
  getApp: {
    title: "Get App now",
    subtitle: "Download our Android & iOS App for ease to use",
    features: [
      "Build your profile with cool avatars and stats from each tournament.",
      "Link your account with your college to participate in college leagues.",
      "Find all your Esports content at one place!",
      "Earn coins to win exciting rewards & merchandises",
    ],
    buttonLabel: "Download App",
    url: "#",
    platforms: "Available for iOS and Android",
  },

  /** Download CTA section (legacy - can merge with getApp) */
  download: {
    ctaTitle: "Ready to join the arena?",
    ctaSubtitle: "Download the Esports App and start your competitive journey today.",
    buttonLabel: "Download App",
    url: "#",
    platforms: "Available for iOS and Android",
  },

  /** Footer credit - "Made By X" link. Set url to "" to hide. */
  credit: {
    prefix: "Made By",
    label: "Moonstack",
    url: "https://www.youtube.com/@MoonStack",
  },

  /** Footer */
  footer: {
    links: [
      { label: "About", href: "#" },
      { label: "Terms & Conditions", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Blogs", href: "#" },
    ],
    copyright: "All Rights Reserved.",
  },

  /** SEO / Meta */
  meta: {
    title: "Esports App - Compete. Connect. Conquer.",
    description:
      "The ultimate platform for esports enthusiasts to discover tournaments, track matches, and connect with the gaming community.",
  },

  /** Primary brand color (hex) - BGMI style red */
  colors: {
    primary: "#e63946",
    primaryHover: "#c1121f",
  },
} as const;

export type BrandConfig = typeof brand;
