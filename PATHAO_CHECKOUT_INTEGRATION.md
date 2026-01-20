# Pathao Integration in Checkout Page - Implementation Guide

## Overview
This guide shows how to integrate Pathao courier system into your checkout page with:
- **Location Selection**: City → Zone → Area dropdowns
- **Delivery Charge Calculation**: Real-time pricing from Pathao API
- **Order Creation**: Automatic Pathao order creation on checkout

---

## Step 1: Update Checkout Page Imports

Add Pathao hooks to the top of `Checkout.tsx`:

```tsx
import { useState, useEffect } from "react";
import { 
  usePathaoCities, 
  usePathaoZones, 
  usePathaoAreas,
  usePathaoStores,
  calculatePathaoPrice,
  createPathaoOrder 
} from "@/hooks/use-pathao";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Truck } from "lucide-react";
```

---

## Step 2: Add Pathao State Management

Inside the `Checkout` component, add these state variables:

```tsx
const Checkout = () => {
  // ... existing code ...
  
  // Pathao integration state
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  
  // Fetch Pathao data
  const { data: cities, isLoading: loadingCities } = usePathaoCities();
  const { data: zones, isLoading: loadingZones } = usePathaoZones(selectedCityId);
  const { data: areas, isLoading: loadingAreas } = usePathaoAreas(selectedZoneId);
  const { data: stores } = usePathaoStores();
  
  // Get default store ID
  const defaultStoreId = stores?.[0]?.store_id;
  
  // ... rest of component ...
}
```

---

## Step 3: Add Delivery Charge Calculation

Add this `useEffect` to calculate delivery charges when location changes:

```tsx
// Calculate delivery charge when zone is selected
useEffect(() => {
  const calculateDelivery = async () => {
    if (!selectedCityId || !selectedZoneId || !defaultStoreId) {
      setDeliveryCharge(0);
      return;
    }

    setIsCalculatingPrice(true);
    try {
      const pricing = await calculatePathaoPrice({
        storeId: defaultStoreId,
        recipientCity: selectedCityId,
        recipientZone: selectedZoneId,
        deliveryType: "normal",
        itemType: "parcel",
        itemWeight: 1.0, // Estimate based on cart
      });
      
      setDeliveryCharge(pricing.total_price);
      
      toast({
        title: "✅ Delivery Charge Calculated",
        description: `Delivery fee: ${formatCurrency(pricing.total_price)}`,
      });
    } catch (error) {
      console.error("Failed to calculate delivery:", error);
      toast({
        title: "⚠️ Could not calculate delivery",
        description: "Using standard delivery charge",
        variant: "destructive",
      });
      setDeliveryCharge(60); // Fallback charge
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  calculateDelivery();
}, [selectedCityId, selectedZoneId, defaultStoreId]);
```

---

## Step 4: Update Form Submission with Pathao Order Creation

Modify the `onSubmit` function:

```tsx
const onSubmit = async (data: CheckoutFormValues) => {
  if (cart.items.length === 0) {
    toast({
      title: "Cart is empty",
      description: "Please add some products to your cart before checking out.",
      variant: "destructive"
    });
    return;
  }

  // Validate Pathao location selection
  if (!selectedCityId || !selectedZoneId || !selectedAreaId) {
    toast({
      title: "📍 Location Required",
      description: "Please select your delivery location (City, Zone, Area)",
      variant: "destructive"
    });
    return;
  }

  setIsSubmitting(true);

  try {
    // Step 1: Create order in our database
    const orderData = {
      ...data,
      total: cart.subtotal + deliveryCharge, // Include delivery charge
      items: cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      }))
    };

    const response = await apiRequest("POST", "/api/orders", orderData);
    const result = await response.json();
    const orderId = result.order.id;

    // Step 2: Create Pathao courier order
    if (defaultStoreId && data.paymentMethod === "cash") {
      try {
        const pathaoOrder = await createPathaoOrder({
          storeId: defaultStoreId,
          merchantOrderId: `ORD-${orderId}`,
          recipientName: data.customerName,
          recipientPhone: data.customerPhone,
          recipientAddress: data.address,
          recipientCity: selectedCityId,
          recipientZone: selectedZoneId,
          recipientArea: selectedAreaId,
          deliveryType: "normal",
          itemType: "parcel",
          itemQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          itemWeight: 1.5, // Estimate based on items
          itemDescription: `Bakery Order - ${cart.items.length} items`,
          amountToCollect: cart.subtotal, // COD amount
          specialInstruction: "Handle with care - Bakery items",
        });

        console.log("Pathao order created:", pathaoOrder);
        
        toast({
          title: "🚚 Delivery Scheduled!",
          description: `Pathao tracking: ${pathaoOrder.data.consignment_id}`,
        });
      } catch (pathaoError) {
        console.error("Pathao order failed:", pathaoError);
        // Continue anyway - order is placed, just delivery scheduling failed
      }
    }

    toast({
      title: "Order placed successfully!",
      description: "Thank you for your order. You will receive a confirmation shortly.",
    });

    clearCart();
    setLocation("/order-confirmation");
  } catch (error) {
    console.error("Checkout error:", error);
    toast({
      title: "Error placing order",
      description: "Something went wrong. Please try again later.",
      variant: "destructive"
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Step 5: Add Location Selection UI

Replace the manual city/state/zip fields with Pathao location selectors:

```tsx
{/* Shipping Address Section */}
<div>
  <h2 className="font-heading text-xl font-bold text-primary mb-4 flex items-center">
    <Truck className="mr-2" size={20} /> Delivery Location
  </h2>
  
  <div className="grid grid-cols-1 gap-4">
    {/* Complete Address */}
    <FormField
      control={form.control}
      name="address"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Complete Address (House/Road/Landmark)</FormLabel>
          <FormControl>
            <Input 
              placeholder="House 12, Road 5, Dhanmondi" 
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* City Selection */}
    <div className="space-y-2">
      <label className="text-sm font-medium">City *</label>
      {loadingCities ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading cities...
        </div>
      ) : (
        <Select
          value={selectedCityId?.toString()}
          onValueChange={(value) => {
            setSelectedCityId(parseInt(value));
            setSelectedZoneId(null);
            setSelectedAreaId(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select City" />
          </SelectTrigger>
          <SelectContent>
            {cities?.map((city) => (
              <SelectItem key={city.city_id} value={city.city_id.toString()}>
                {city.city_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>

    {/* Zone Selection */}
    <div className="space-y-2">
      <label className="text-sm font-medium">Zone/Area *</label>
      {loadingZones ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading zones...
        </div>
      ) : (
        <Select
          value={selectedZoneId?.toString()}
          onValueChange={(value) => {
            setSelectedZoneId(parseInt(value));
            setSelectedAreaId(null);
          }}
          disabled={!selectedCityId}
        >
          <SelectTrigger>
            <SelectValue placeholder={!selectedCityId ? "Select city first" : "Select Zone"} />
          </SelectTrigger>
          <SelectContent>
            {zones?.map((zone) => (
              <SelectItem key={zone.zone_id} value={zone.zone_id.toString()}>
                {zone.zone_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>

    {/* Area Selection */}
    <div className="space-y-2">
      <label className="text-sm font-medium">Specific Area *</label>
      {loadingAreas ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading areas...
        </div>
      ) : (
        <Select
          value={selectedAreaId?.toString()}
          onValueChange={(value) => setSelectedAreaId(parseInt(value))}
          disabled={!selectedZoneId}
        >
          <SelectTrigger>
            <SelectValue placeholder={!selectedZoneId ? "Select zone first" : "Select Area"} />
          </SelectTrigger>
          <SelectContent>
            {areas?.map((area) => (
              <SelectItem key={area.area_id} value={area.area_id.toString()}>
                {area.area_name} {area.post_code ? `(${area.post_code})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  </div>
</div>
```

---

## Step 6: Update Order Summary with Delivery Charge

```tsx
{/* Order Summary */}
<div className="space-y-4 pt-3 border-t border-gray-200">
  <div className="flex justify-between">
    <span>Subtotal</span>
    <span className="font-semibold">{formatCurrency(cart.subtotal)}</span>
  </div>
  
  <div className="flex justify-between items-center">
    <span className="flex items-center gap-2">
      <Truck size={16} />
      Delivery Charge
      {isCalculatingPrice && <Loader2 className="w-4 h-4 animate-spin" />}
    </span>
    <span className="font-semibold text-primary">
      {deliveryCharge > 0 ? formatCurrency(deliveryCharge) : "Calculate..."}
    </span>
  </div>
  
  <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200">
    <span>Total</span>
    <span className="text-primary">{formatCurrency(cart.subtotal + deliveryCharge)}</span>
  </div>
</div>
```

---

## Step 7: Add Store Creation Reminder

Before the Order Summary, add a helpful notice:

```tsx
{/* Store Notice */}
{!defaultStoreId && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
    <p className="text-sm text-yellow-800 font-medium">
      ⚠️ No store configured for Pathao delivery
    </p>
    <p className="text-xs text-yellow-700 mt-1">
      Please create a store in Pathao merchant panel to enable automated delivery scheduling.
    </p>
  </div>
)}
```

---

## Testing Checklist:

- [ ] Cities load from Pathao API
- [ ] Zones load when city is selected
- [ ] Areas load when zone is selected
- [ ] Delivery charge calculates automatically
- [ ] Order creates successfully in database
- [ ] Pathao order creates (if store configured)
- [ ] Total includes delivery charge
- [ ] Validation prevents checkout without location

---

## Next Steps:

1. **Create a Store** in Pathao dashboard
2. **Test the full flow** from product selection to checkout
3. **Add Order Tracking** page to show Pathao status
4. **Style the dropdowns** to match your design system

---

That's it! Your checkout page now has full Pathao integration! 🎉
