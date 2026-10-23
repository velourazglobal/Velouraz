import useSEO from '../../hooks/useSEO';
import Hero from './Hero'
import PromoSlider from './PromoSlider'
import TestimonialSection from './Testemonials'
import TheJournal from './News'
import BestSellers from './Bestsellers'
import TheEdit from './TheEdit'
import QualitySection from './WhyChoose'
import CategorySection from './CategorySection'
import Stories from './Stories'
import Marquee from './Marquee'
import Newsletter from '../Newsletter'
import FAQ from './FAQ'

function Home() {
  useSEO({
    title: 'Globally Curated Jewellery for the Modern Woman',
    description: 'Velouraz brings you handpicked jewellery inspired by cultures across India, Paris, Thailand, Japan, South Korea and beyond. Shop earrings, bangles, rings, necklaces and bracelets crafted for the modern woman.',
    keywords: 'velouraz, jewellery india, globally curated jewellery, statement earrings, gold bangles, bridal jewellery, shop jewellery online india, festive jewellery',
    canonical: '/',
    ogType: 'website',
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": "https://www.velouraz.in/#business",
        "name": "Velouraz",
        "image": "https://www.velouraz.in/img/logo.png",
        "description": "Velouraz is a globally curated jewellery brand bringing handpicked pieces inspired by cultures across India, Paris, Thailand, Japan, South Korea and beyond.",
        "url": "https://www.velouraz.in",
        "telephone": "+91-83494-40045",
        "email": "contact@velouraz.in",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "783 Khatiwala Tank",
          "addressLocality": "Indore",
          "addressRegion": "Madhya Pradesh",
          "postalCode": "452014",
          "addressCountry": "IN"
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "10:00",
          "closes": "19:00"
        },
        "priceRange": "$$",
        "currenciesAccepted": "INR",
        "paymentAccepted": "Cash, Credit Card, UPI",
        "sameAs": [
          "https://www.instagram.com/_velouraz_",
          "https://www.facebook.com/share/1Bg4DRSKhd/"
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Who are the founders behind Velouraz, and what is the brand's story?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Velouraz was born from a friendship transformed into a global journey. Best friends and founders, Zahabiya Kalabhai and Alifiya Bohra, found inspiration during their international travels. Their desire to bring the world's most captivating jewellery traditions into one cohesive collection led to the creation of Velouraz — a brand where the world becomes jewellery, and jewellery becomes part of your story."
            }
          },
          {
            "@type": "Question",
            "name": "What makes Velouraz jewellery globally curated?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Our collections draw inspiration from cultural hubs across the globe. From the delicate artistry of Japanese Miyuki beads and luminous South Korean pearls to the ancient symbolism of Turkish stones, Australian opals, Chinese jade, Parisian elegance, and the rich Kundan and Polki heritage of India, we bridge global destinations with contemporary style."
            }
          },
          {
            "@type": "Question",
            "name": "Is Velouraz jewellery made of real silver and precious materials?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, we uphold 'The Velouraz Standard'. Our premium selections include fine 925 Sterling Silver pieces containing 92.5% pure silver. We also utilize high-quality anti-tarnish alloys, 18K/22K gold plating, and hand-selected precious stones designed for enduring beauty and everyday wear."
            }
          },
          {
            "@type": "Question",
            "name": "What types of jewellery can I buy from the Velouraz online shop?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We offer a wide variety of haute joaillerie including statement Earrings, Rings, Necklaces, Bracelets, Bangles, and exclusive Bridal Wear. Each piece is designed for the modern woman who seeks luxury that is felt rather than flaunted."
            }
          },
          {
            "@type": "Question",
            "name": "What is your return and exchange policy for online orders?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We offer a hassle-free 7-day return and exchange policy for unworn items in their original packaging. Because we deal in premium jewellery, we require customers to record a continuous unboxing video upon receiving their package to help us process any defect or transit damage claims swiftly."
            }
          }
        ]
      }
    ]
  });

  return (
    <>
      <Hero />
      <Marquee />
      <PromoSlider />
      <BestSellers />
      <QualitySection />
      {/* <CategorySection /> */}
      {/* <TheEdit /> */}
      <TestimonialSection />
      {/* <Stories/> */}
      <TheJournal />
      <FAQ />
      <Newsletter />
    </>
  )
}

export default Home
