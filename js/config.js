
/* Krishana Jewellers — frontend configuration
   NO SECRETS HERE. Only public API endpoints and defaults. */
(function(){
  const IS_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  window.APP_CONFIG = {
    /* ---- API -------------------------------------------------------- */
    /* Replace DEPLOYMENT_ID with your Apps Script Web App deployment ID. */
    API_BASE: 'https://script.google.com/macros/s/AKfycbwduqwMLm93Ox308rP_Uy-jbAW-EjQaKZPoncqBnKiqeNlV-trX0kel1KGNMewr48iy9Q/exec',
    API_VERSION: 'v1',

    /* ---- Cache ------------------------------------------------------ */
    PUBLIC_CACHE_KEY: 'kj_public_cache_v2',
    CACHE_TTL_MS: 1000 * 60 * 5,   // 5 minutes

    /* ---- Brand defaults (used if API is unreachable AND no cache) --- */
    DEFAULT_SETTINGS: {
      brandName:'Krishana Jewellers',
      instagram:'krishana_jewellers.96',
      instagramUrl:'https://instagram.com/krishana_jewellers.96',
      whatsapp:'',       // country code + number, digits only, no +
      phone:'',
      email:'',
      address:'Showroom address to be configured',
      city:'',
      mapsUrl:'',
      hours:'',
      announcement:'Discover timeless jewellery for every celebration',
      heroTitle:'Jewellery Made for Your Moments',
      heroDescription:'Discover elegant gold jewellery designed for celebrations, traditions and everyday memories.',
      heroImage:'',
      logo:'',
      favicon:''
    },
    DEFAULT_THEME: {
      primaryColor:'#181614',
      secondaryColor:'#E8D7B5',
      accentColor:'#B88A2E',
      backgroundColor:'#FAF7F0',
      surfaceColor:'#F2ECE1',
      textColor:'#2A2724',
      mutedColor:'#7A736A',
      darkColor:'#181614',
      buttonColor:'#181614',
      buttonTextColor:'#ffffff',
      announcementColor:'#181614',
      announcementTextColor:'#E8D7B5',
      fontHeading:"'Cormorant Garamond',serif",
      fontBody:"'Jost',sans-serif",
      borderRadius:'3px',
      shadowStyle:'0 12px 40px -18px rgba(24,22,20,.35)'
    },
    DEFAULT_NAVIGATION: [
      {id:'n1', label:'Collections',  href:'#/catalogue',         enabled:'TRUE',  sortOrder:1},
      {id:'n2', label:'Bridal',       href:'#/bridal-jewellery',  enabled:'TRUE',  sortOrder:2},
      {id:'n3', label:'Gold Jewellery',href:'#/gold-jewellery',   enabled:'TRUE',  sortOrder:3},
      {id:'n4', label:'New Arrivals', href:'#/new-arrivals',      enabled:'TRUE',  sortOrder:4},
      {id:'n5', label:'About',        href:'#/about',             enabled:'TRUE',  sortOrder:5},
      {id:'n6', label:'Showroom',     href:'#/showroom',          enabled:'TRUE',  sortOrder:6},
      {id:'n7', label:'Contact',      href:'#/contact',           enabled:'TRUE',  sortOrder:7}
    ],
    DEFAULT_FEATURES: {
      showInstagram: 'TRUE',
      showTestimonials: 'TRUE',
      showTrustSection: 'TRUE',
      showShowroom: 'TRUE',
      enableWishlist: 'TRUE'
    },
    /* Empty starter dataset — admin will populate via Sheets. */
    DEFAULT_PRODUCTS: [],
    DEFAULT_CATEGORIES: [],
    DEFAULT_GALLERY: [],
    DEFAULT_TESTIMONIALS: [],

    IS_LOCAL
  };
})();
