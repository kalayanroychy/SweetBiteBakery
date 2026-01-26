
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, MessageCircle, Share2, Plus } from "lucide-react";

/**
 * Variant 2: "The Masonry Wall" (Pinterest Style)
 * Concept: Waterfall Grid, Discovery, Social, Mixed Content.
 */
const HomeVariant2 = () => {
    return (
        <Layout>
            <Helmet>
                <title>Probashi Bakery | Discover</title>
                <style>{`
                  .masonry-grid {
                      column-count: 2;
                      column-gap: 1.5rem;
                  }
                  @media (min-width: 768px) {
                      .masonry-grid { column-count: 3; }
                  }
                  @media (min-width: 1024px) {
                      .masonry-grid { column-count: 4; }
                  }
                  .masonry-item {
                      break-inside: avoid;
                      margin-bottom: 1.5rem;
                  }
                `}</style>
            </Helmet>

            <main className="bg-gray-50 min-h-screen p-4 md:p-8">

                {/* FLOATING HEADER */}
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur shadow-xl rounded-full px-8 py-3 flex items-center gap-8">
                    <Link href="/" className="font-bold text-xl text-red-600">Probashi Bakery</Link>
                    <div className="hidden md:flex gap-1 bg-gray-100 rounded-full p-1">
                        <Button variant="ghost" className="rounded-full bg-white shadow-sm h-8 text-xs font-bold">For You</Button>
                        <Button variant="ghost" className="rounded-full h-8 text-xs font-bold text-gray-500">Cakes</Button>
                        <Button variant="ghost" className="rounded-full h-8 text-xs font-bold text-gray-500">Bread</Button>
                        <Button variant="ghost" className="rounded-full h-8 text-xs font-bold text-gray-500">Videos</Button>
                    </div>
                    <Button size="icon" className="rounded-full bg-red-600 hover:bg-red-700 h-8 w-8"><Plus size={16} /></Button>
                </div>

                <div className="pt-24 container mx-auto">
                    <div className="masonry-grid">

                        {/* CARD TYPE 1: PRODUCT (Tall) */}
                        <div className="masonry-item relative group rounded-3xl overflow-hidden cursor-pointer">
                            <img src="https://images.unsplash.com/photo-1612203985729-70726954388c?q=80&w=600" className="w-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute top-4 right-4">
                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 rounded-full text-white font-bold">Save</Button>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center px-4 py-2 bg-white/90 backdrop-blur rounded-full">
                                    <span className="font-bold text-sm">Wedding Tier</span>
                                    <span className="font-bold text-sm">৳5000</span>
                                </div>
                            </div>
                        </div>

                        {/* CARD TYPE 2: QUOTE (Short) */}
                        <div className="masonry-item bg-[#FFD700] rounded-3xl p-8 flex items-center justify-center text-center">
                            <h3 className="font-serif text-2xl font-bold italic text-[#5D4037]">
                                "Life is uncertain. Eat dessert first."
                            </h3>
                        </div>

                        {/* CARD TYPE 3: VIDEO (Medium) */}
                        <div className="masonry-item relative group rounded-3xl overflow-hidden cursor-pointer">
                            <div className="relative">
                                <img src="https://images.unsplash.com/photo-1509365465985-25d11c17e812?q=80&w=600" className="w-full object-cover filter brightness-75" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/30 backdrop-blur rounded-full flex items-center justify-center">
                                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-white">
                                <h4 className="font-bold text-sm">How to glaze cinnamon rolls 🧁</h4>
                            </div>
                        </div>

                        {/* CARD TYPE 4: PRODUCT (Standard) */}
                        <div className="masonry-item relative group rounded-3xl overflow-hidden cursor-pointer">
                            <img src="https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=600" className="w-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute top-4 right-4">
                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 rounded-full text-white font-bold">Save</Button>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center px-4 py-2 bg-white/90 backdrop-blur rounded-full">
                                    <span className="font-bold text-sm">Pain au Choc</span>
                                    <span className="font-bold text-sm">৳200</span>
                                </div>
                            </div>
                        </div>

                        {/* CARD TYPE 5: RECIPE BLOG */}
                        <div className="masonry-item bg-white rounded-3xl overflow-hidden shadow-sm">
                            <img src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=600" className="w-full h-32 object-cover" />
                            <div className="p-4">
                                <span className="text-xs font-bold text-gray-400 uppercase">Blog</span>
                                <h3 className="font-bold text-lg leading-tight mt-1 mb-2">5 Secrets to Perfect Macarons</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                                    <span className="text-xs text-gray-500">By Chef John</span>
                                </div>
                            </div>
                        </div>

                        {/* MORE ITEMS... */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="masonry-item relative group rounded-3xl overflow-hidden cursor-pointer">
                                <img src={`https://source.unsplash.com/random/400x${400 + (i * 50)}/?bakery,dessert`} className="w-full object-cover" />
                                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="font-bold text-sm">Sweet Inspiration #{i}</p>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </main>
        </Layout>
    );
};

export default HomeVariant2;
