
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronDown } from "lucide-react";

/**
 * Variant 3: "The Full-Page Deck" (Snap Scroll)
 * Concept: One Section Per Viewport, Cinematic, Focused.
 */
const HomeVariant3 = () => {
    return (
        <Layout>
            <Helmet>
                <title>Probashi Bakery | Presentation</title>
                <style>{`
                  .snap-container {
                      height: 100vh;
                      overflow-y: scroll;
                      scroll-snap-type: y mandatory;
                  }
                  .snap-section {
                      height: 100vh;
                      scroll-snap-align: start;
                      width: 100%;
                      position: relative;
                  }
                `}</style>
            </Helmet>

            <main className="snap-container bg-black text-white">

                {/* SECTION 1: HERO */}
                <section className="snap-section flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=2000')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="relative z-10 text-center">
                        <h1 className="text-8xl font-black uppercase tracking-tighter mb-4 drop-shadow-lg">
                            Dark<br />Matter.
                        </h1>
                        <p className="text-2xl font-light mb-8 max-w-xl mx-auto drop-shadow-md">
                            Chocolate so rich, it absorbs light. Experience the new collection.
                        </p>
                        <Button className="bg-white text-black hover:bg-gray-200 rounded-none px-8 py-6 text-xl font-bold uppercase">
                            Taste It
                        </Button>
                    </div>
                    <div className="absolute bottom-8 animate-bounce">
                        <ChevronDown size={40} />
                    </div>
                </section>

                {/* SECTION 2: PRODUCT FOCUS */}
                <section className="snap-section bg-[#1A1A1A] flex flex-col md:flex-row">
                    <div className="flex-1 flex items-center justify-center p-12">
                        <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800" className="max-w-[80%] max-h-[80%] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center p-12 md:pr-24">
                        <span className="text-[#FF4F00] font-bold tracking-widest uppercase mb-4">Best Seller</span>
                        <h2 className="text-6xl font-bold mb-6">Velvet Crown</h2>
                        <p className="text-gray-400 text-xl leading-relaxed mb-8">
                            Three layers of red velvet sponge, separated by our signature cream cheese frosting. Finished with dark chocolate shards.
                        </p>
                        <ul className="text-gray-500 mb-8 space-y-2">
                            <li>✦ 100% Organic Cocoa</li>
                            <li>✦ Farm Fresh Eggs</li>
                            <li>✦ 48h Preparation</li>
                        </ul>
                        <div className="flex items-center gap-8">
                            <span className="text-4xl font-light">৳1200</span>
                            <Button className="bg-[#FF4F00] text-white hover:bg-[#CC3E00] rounded-none px-8 py-6">
                                Add to Cart
                            </Button>
                        </div>
                    </div>
                </section>

                {/* SECTION 3: VIDEO / MOTION */}
                <section className="snap-section relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-indigo-900">
                        {/* Placeholder for video */}
                        <img src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=2000" className="w-full h-full object-cover mix-blend-overlay opacity-50" />
                    </div>
                    <div className="relative z-10 text-center max-w-4xl px-4">
                        <h2 className="text-6xl md:text-8xl font-black mb-8 leading-none">
                            Behind<br />The Scenes
                        </h2>
                        <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-black rounded-full px-12 py-8 text-xl uppercase tracking-widest">
                            Play Film
                        </Button>
                    </div>
                </section>

                {/* SECTION 4: GRID / MENU */}
                <section className="snap-section bg-white text-black p-4 md:p-12 flex flex-col justify-center">
                    <h2 className="text-4xl font-black uppercase mb-12 text-center">The Full Menu</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto w-full h-[70vh]">
                        {[
                            "https://images.unsplash.com/photo-1551024601-563772a8b411?q=80&w=600",
                            "https://images.unsplash.com/photo-1509365465985-25d11c17e812?q=80&w=600",
                            "https://images.unsplash.com/photo-1639678825838-89c5691d1e4e?q=80&w=600",
                            "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=600"
                        ].map((img, i) => (
                            <div key={i} className="relative group overflow-hidden bg-gray-100 cursor-pointer">
                                <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-bold uppercase tracking-widest border-b-2 border-white">View</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <Link href="/products" className="text-xl font-bold underline decoration-4 underline-offset-4 hover:decoration-[#FF4F00] transition-colors">
                            View All 48 Products
                        </Link>
                    </div>
                </section>

            </main>
        </Layout>
    );
};

export default HomeVariant3;
