import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { CheckCircle, ChevronRight, ShoppingBag, Package } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const OrderConfirmation = () => {
  const [_, setLocation] = useLocation();
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    email: string;
  } | null>(null);

  // Get order details from sessionStorage
  useEffect(() => {
    const hasPlacedOrder = sessionStorage.getItem("order_placed");
    const orderId = sessionStorage.getItem("order_id");
    const email = sessionStorage.getItem("order_email");

    if (!hasPlacedOrder || !orderId || !email) {
      setLocation("/");
    } else {
      setOrderDetails({ orderId, email });

      // Clear session storage when component unmounts
      return () => {
        sessionStorage.removeItem("order_placed");
        sessionStorage.removeItem("order_id");
        sessionStorage.removeItem("order_email");
      };
    }
  }, [setLocation]);

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);

  const formattedDeliveryDate = estimatedDelivery.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  if (!orderDetails) return null;

  return (
    <Layout>
      <Helmet>
        <title>Order Confirmation | SweetBite Bakery</title>
        <meta name="description" content="Thank you for your order at SweetBite Bakery." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="container mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
        <div className="max-w-2xl w-full">
          <Card className="border-success">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
                  <CheckCircle className="text-success h-8 w-8 md:h-10 md:w-10" />
                </div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary mb-2">Order Confirmed!</h1>
                <p className="text-text-dark text-sm md:text-base">
                  Thank you for your order. We've received your order and will begin processing it right away.
                </p>
              </div>

              <div className="bg-neutral rounded-md p-4 md:p-6 mb-6 md:mb-8">
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <span className="text-text-dark text-xs md:text-sm">Order ID:</span>
                  <span className="font-semibold text-sm md:text-base">#{orderDetails.orderId}</span>
                </div>
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <span className="text-text-dark text-xs md:text-sm">Email:</span>
                  <span className="font-semibold text-xs md:text-sm truncate ml-2">{orderDetails.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-dark text-xs md:text-sm">Estimated Delivery:</span>
                  <span className="font-semibold text-xs md:text-sm">{formattedDeliveryDate}</span>
                </div>
              </div>

              {/* Track Order Info */}
              <div className="bg-primary/5 border border-primary/20 rounded-md p-4 md:p-6 mb-6 md:mb-8">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 md:p-3 rounded-full flex-shrink-0">
                    <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2">Track Your Order</h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-3">
                      Use your Order ID <strong>#{orderDetails.orderId}</strong> and email to track your delivery status anytime.
                    </p>
                    <Button
                      onClick={() => setLocation("/order-tracking")}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-sm"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Track Order Now
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-4 md:py-6 mb-6 md:mb-8">
                <h2 className="font-heading text-lg md:text-xl font-bold text-primary mb-4">What happens next?</h2>
                <ul className="space-y-3 md:space-y-4">
                  <li className="flex">
                    <div className="mr-3 md:mr-4 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm md:text-base">Order Processing</h3>
                      <p className="text-xs md:text-sm text-text-dark">
                        We're preparing your order in our bakery with the freshest ingredients.
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="mr-3 md:mr-4 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm md:text-base">Ready for Delivery</h3>
                      <p className="text-xs md:text-sm text-text-dark">
                        Your order will be dispatched via Pathao courier for fast delivery.
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="mr-3 md:mr-4 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm md:text-base">Enjoy Your Sweet Treats!</h3>
                      <p className="text-xs md:text-sm text-text-dark">
                        Savor the delicious flavors of your SweetBite bakery items.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white text-sm"
                  onClick={() => setLocation("/")}
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Return to Home
                </Button>
                <Button
                  className="bg-primary text-white hover:bg-opacity-90 text-sm"
                  onClick={() => setLocation("/products")}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
