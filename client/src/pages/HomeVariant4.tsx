
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, Coffee, ShoppingBag, Heart, Settings, Bell, Search, PlusCircle } from "lucide-react";

/**
 * Variant 4: "The Console / App" (Sidebar Nav)
 * Concept: Dashboard, Utility, Web App Feel, Sidebar Navigation.
 */
const HomeVariant4 = () => {
    return (
        <Layout>
            <Helmet>
                <title>Probashi Bakery | App</title>
                <style>{`
                  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
                  .font-console { font-family: 'Space Grotesk', sans-serif; }
                `}</style>
            </Helmet>

            <main className="bg-[#F0F2F5] text-[#333] font-console min-h-screen flex">

                {/* SIDEBAR */}
                <aside className="w-64 bg-white border-r border-gray-200 fixed h-full hidden md:flex flex-col justify-between p-6 z-20">
                    <div>
                        <div className="flex items-center gap-3 mb-10 px-2">
                            <div className="w-8 h-8 bg-black rounded-lg"></div>
                            <span className="font-bold text-xl tracking-tight">Probashi Bakery</span>
                        </div>

                        <div className="space-y-1">
                            <Button variant="ghost" className="w-full justify-start font-bold bg-gray-100"><Home size={18} className="mr-3" /> Home</Button>
                            <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-black"><Coffee size={18} className="mr-3" /> Menu</Button>
                            <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-black"><ShoppingBag size={18} className="mr-3" /> Orders</Button>
                            <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-black"><Heart size={18} className="mr-3" /> Favorites</Button>
                        </div>

                        <div className="mt-8">
                            <span className="text-xs font-bold text-gray-400 uppercase px-2 mb-2 block">Categories</span>
                            <div className="space-y-1">
                                <Button variant="ghost" className="w-full justify-start text-sm text-gray-500 h-8">Cakes</Button>
                                <Button variant="ghost" className="w-full justify-start text-sm text-gray-500 h-8">Bread</Button>
                                <Button variant="ghost" className="w-full justify-start text-sm text-gray-500 h-8">Pastries</Button>
                                <Button variant="ghost" className="w-full justify-start text-sm text-gray-500 h-8">Drinks</Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-black"><Settings size={18} className="mr-3" /> Settings</Button>
                        <div className="flex items-center gap-3 p-2 mt-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500"></div>
                            <div className="text-xs">
                                <div className="font-bold">Kalayan Roy</div>
                                <div className="text-gray-500">Free Account</div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 md:ml-64 p-6 md:p-12">

                    {/* TOP BAR */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold">Good Morning, Kalayan ☀️</h1>
                            <p className="text-gray-500 text-sm">Let's find you something delicious.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input placeholder="Search..." className="pl-10 pr-4 py-2 rounded-full border border-gray-200 outline-none focus:border-black w-64 text-sm bg-white" />
                            </div>
                            <Button size="icon" variant="outline" className="rounded-full bg-white"><Bell size={18} /></Button>
                            <Button size="icon" className="rounded-full bg-black hover:bg-gray-800"><ShoppingBag size={18} /></Button>
                        </div>
                    </div>

                    {/* DASHBOARD GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT COLUMN (Content) */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* FEATURED BANNER */}
                            <div className="bg-[#111] rounded-3xl p-8 text-white relative overflow-hidden flex items-center">
                                <div className="relative z-10 max-w-sm">
                                    <span className="bg-[#FF4F00] text-xs font-bold px-2 py-1 rounded mb-4 inline-block">PROMO</span>
                                    <h2 className="text-3xl font-bold mb-4">50% Off Giant Cookies</h2>
                                    <p className="text-gray-400 mb-6 text-sm">Order a box of 6 or more and get half off instantly. Limited time only.</p>
                                    <Button className="bg-white text-black hover:bg-gray-200 rounded-lg px-6 font-bold">Claim Offer</Button>
                                </div>
                                <img src="https://images.unsplash.com/photo-1499636138143-bd649043ea52?q=80&w=600" className="absolute right-0 top-0 h-full w-1/2 object-cover mask-gradient-left opacity-80" />
                            </div>

                            {/* QUICK CATEGORIES */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg">Categories</h3>
                                    <a href="#" className="text-sm font-bold text-blue-600">See All</a>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { name: "Donuts", icon: "🍩" },
                                        { name: "Croissant", icon: "🥐" },
                                        { name: "Cake", icon: "🎂" },
                                        { name: "Coffee", icon: "☕" }
                                    ].map((cat, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow cursor-pointer">
                                            <span className="text-2xl">{cat.icon}</span>
                                            <span className="font-bold text-sm">{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* POPULAR ITEMS */}
                            <div>
                                <h3 className="font-bold text-lg mb-4">Popular now</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { title: "Berry Cheese Cake", price: "৳350", img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=300" },
                                        { title: "Choco Lava", price: "৳220", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=300" }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white p-3 rounded-2xl flex gap-4 items-center hover:shadow-md transition-shadow cursor-pointer">
                                            <img src={item.img} className="w-20 h-20 rounded-xl object-cover" />
                                            <div className="flex-1">
                                                <h4 className="font-bold">{item.title}</h4>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="font-bold text-[#FF4F00]">{item.price}</span>
                                                    <Button size="icon" className="w-8 h-8 rounded-full bg-gray-100 text-black hover:bg-black hover:text-white"><PlusCircle size={16} /></Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN (Cart/Stats) */}
                        <div className="space-y-8">
                            <div className="bg-white p-6 rounded-3xl h-full">
                                <h3 className="font-bold text-lg mb-6">Your Cart</h3>

                                <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                                    <ShoppingBag size={48} className="mb-4 opacity-20" />
                                    <p>Your cart is empty</p>
                                    <Button variant="outline" className="mt-4 rounded-full">Start Shopping</Button>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h3 className="font-bold text-lg mb-4">Recent Orders</h3>
                                    <div className="space-y-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold">1</div>
                                            <div className="flex-1">
                                                <div className="font-bold text-sm">Order #2451</div>
                                                <div className="text-xs text-gray-400">2 Items • Delivered</div>
                                            </div>
                                            <div className="text-sm font-bold">৳550</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </main>
        </Layout>
    );
};

export default HomeVariant4;
