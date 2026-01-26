
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, MapPin, Mail, Phone } from "lucide-react";

/**
 * Variant 1: "The Split Screen"
 * Concept: 50% Fixed Visual (Brand), 50% Scrollable Content (Shop).
 */
const HomeVariant1 = () => {
    return (
        <Layout>
            <Helmet>
                <title>Probashi Bakery | Art & Shop</title>
                <style>{`
                  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Inter:wght@300;400;500&display=swap');
                  .font-display { font-family: 'Syne', sans-serif; }
                  .font-body { font-family: 'Inter', sans-serif; }
                `}</style>
            </Helmet>

            <main className="flex flex-col lg:flex-row min-h-screen bg-white">

                {/* LEFT: FIXED BRAND PANEL */}
                <section className="lg:w-1/2 h-[50vh] lg:h-screen lg:fixed lg:top-0 lg:left-0 bg-[#E8E6E1] flex flex-col justify-between p-8 lg:p-16 relative overflow-hidden text-[#1A1A1A] z-10">
                    {/* Background Texture/Image */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/noise.png')]"></div>
                    <img
                        src="https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1200"
                        className="absolute inset-0 w-full h-full object-cover opacity-20 hover:opacity-100 transition-opacity duration-1000 mix-blend-multiply"
                    />

                    <div className="relative z-10">
                        <h1 className="font-display text-4xl lg:text-7xl font-bold uppercase tracking-tight leading-[0.9]">
                            Sweet<br />Bite<br />Studio.
                        </h1>
                        <p className="mt-6 font-body text-sm lg:text-lg max-w-sm opacity-80">
                            A curated bakery concept blurring the lines between gastronomy and art.
                        </p>
                    </div>

                    <div className="relative z-10 hidden lg:flex flex-col gap-4 font-body text-sm font-medium">
                        <div className="flex gap-4">
                            <a href="#" className="hover:underline">Instagram</a>
                            <a href="#" className="hover:underline">Behance</a>
                            <a href="#" className="hover:underline">Spotify</a>
                        </div>
                        <div className="text-xs opacity-50">
                            EST. 2024 • DHAKA, BD
                        </div>
                    </div>
                </section>

                {/* RIGHT: SCROLLABLE CONTENT */}
                <section className="lg:w-1/2 lg:ml-[50%] bg-white font-body px-6 py-12 lg:p-24 min-h-screen">

                    {/* NAV */}
                    <div className="flex justify-end mb-16 gap-6 text-sm uppercase tracking-widest font-bold">
                        <Link href="/products" className="hover:opacity-50 transition-opacity">Shop</Link>
                        <Link href="/about" className="hover:opacity-50 transition-opacity">About</Link>
                        <Link href="/contact" className="hover:opacity-50 transition-opacity">Cart (0)</Link>
                    </div>

                    {/* LATEST DROPS */}
                    <div className="mb-24">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-2 h-2 bg-[#FF4F00] rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold uppercase text-[#FF4F00]">Just Dropped</span>
                        </div>
                        <h2 className="font-display text-4xl lg:text-5xl font-bold mb-12">New Arrivals</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
                            {[
                                { title: "Pain Au Chocolat", price: "৳220", img: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=600" },
                                { title: "Lemon Tart", price: "৳180", img: "https://images.unsplash.com/photo-1546815670-5c6e2689d06b?q=80&w=600" },
                                { title: "Rye Sourdough", price: "৳300", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600" },
                                { title: "Velvet Cake", price: "৳1200", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600" },
                            ].map((item, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <div className="aspect-[3/4] overflow-hidden mb-4 bg-gray-100">
                                        <img src={item.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    </div>
                                    <div className="flex justify-between items-baseline border-b border-black pb-2">
                                        <h3 className="font-bold text-lg">{item.title}</h3>
                                        <span>{item.price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MANIFESTO */}
                    <div className="mb-24 py-24 border-t border-b border-gray-100">
                        <span className="block text-xs font-bold uppercase mb-8 text-gray-400">Our Philosophy</span>
                        <p className="font-display text-2xl lg:text-3xl leading-relaxed">
                            "We believe that a croissant involves as much architecture as a skyscraper. We respect the flour, we honor the butter, and we worship the heat."
                        </p>
                    </div>

                    {/* FOOTER */}
                    <div className="grid grid-cols-2 gap-8 text-sm text-gray-500">
                        <div>
                            <span className="block font-bold text-black mb-4">Visit Us</span>
                            <p>25 katalgonj Road,Panchalish Thanar Mor, Chittagong 4203</p>
                            <p>Mon-Sun: 8am - 8pm</p>
                        </div>
                        <div>
                            <span className="block font-bold text-black mb-4">Contact</span>
                            <p>probasprobashibakery@gmail.com </p>
                            <p>01829 88 88 88</p>
                        </div>
                    </div>

                </section>
            </main>
        </Layout>
    );
};

export default HomeVariant1;
