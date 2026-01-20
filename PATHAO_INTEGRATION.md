# Pathao Courier Integration Guide

This guide explains how to integrate the Pathao Courier API with your SweetBite Bakery checkout system.

## Prerequisites

1. **Pathao Merchant Account**
   - Login to: https://merchant.pathao.com/
   - Email: probashibakery@gmail.com
   - Password: Probashi1234@

2. **API Credentials**
   - Navigate to the **Developer API** section in your Pathao Merchant Dashboard
   - Copy your **Client ID** and **Client Secret**

## Environment Variables

Add these to your `.env` file:

```env
# Pathao Courier API Configuration
PATHAO_CLIENT_ID=your_client_id_here
PATHAO_CLIENT_SECRET=your_client_secret_here
PATHAO_USERNAME=probashibakery@gmail.com
PATHAO_PASSWORD=Probashi1234@
PATHAO_BASE_URL=https://hermes-api.pathao.com
PATHAO_STORE_ID=your_default_store_id  # Optional: Get this from merchant panel
```

## Getting API Credentials

1. Login to https://merchant.pathao.com/ with your credentials
2. Navigate to **Settings** > **Developer API**
3. You'll find your:
   - Client ID
   - Client Secret
4. Create a store if you haven't already:
   - Go to **My Stores**
   - Add store details (name, address, city, zone, area)
   - Note the Store ID

## API Endpoints

### Frontend Endpoints

#### 1. Get Cities
```typescript
GET /api/pathao/cities

Response:
[
  {
    "city_id": 1,
    "city_name": "Dhaka"
  },
  ...
]
```

#### 2. Get Zones by City
```typescript
GET /api/pathao/zones/:cityId

Response:
[
  {
    "zone_id": 1,
    "zone_name": "Gulshan",
    "city_id": 1
  },
  ...
]
```

#### 3. Get Areas by Zone
```typescript
GET /api/pathao/areas/:zoneId

Response:
[
  {
    "area_id": 1,
    "area_name": "Gulshan 1",
    "zone_id": 1,
    "city_id": 1,
    "post_code": "1212"
  },
  ...
]
```

#### 4. Get Stores
```typescript
GET /api/pathao/stores

Response:
[
  {
    "store_id": 123,
    "store_name": "Probashi Bakery Main Store",
    "store_address": "123 Bakery Lane",
    "city_id": 1,
 "zone_id": 10,
    "area_id": 50
  },
  ...
]
```

#### 5. Calculate Delivery Price
```typescript
POST /api/pathao/calculate-price

Request Body:
{
  "storeId": 123,
  "recipientCity": 1,
  "recipientZone": 15,
  "deliveryType": "normal",  // "normal" or "48" (urgent)
  "itemType": "parcel",      // "parcel" or "document"
  "itemWeight": 1.5          // in kg
}

Response:
{
  "price": 60,
  "cod_charge": 10,
  "promo_discount": 0,
  "total_price": 70
}
```

#### 6. Create Order
```typescript
POST /api/pathao/create-order

Request Body:
{
  "storeId": 123,
  "merchantOrderId": "ORD-12345",
  "recipientName": "John Doe",
  "recipientPhone": "01712345678",
  "recipientAddress": "House 10, Road 5, Dhanmondi",
  "recipientCity": 1,
  "recipientZone": 10,
  "recipientArea": 50,
  "deliveryType": "normal",
  "itemType": "parcel",
  "itemQuantity": 1,
  "itemWeight": 1.5,
  "itemDescription": "Bakery Items - Cake & Pastries",
  "amountToCollect": 1500,  // For Cash on Delivery
  "specialInstruction": "Handle with care"
}

Response:
{
  "type": "success",
  "code": 200,
  "message": "Order has been placed successfully",
  "data": {
    "consignment_id": "D123456",
    "merchant_order_id": "ORD-12345",
    "order_status": "Pending",
    "invoice_id": "INV123456"
  }
}
```

#### 7. Track Order
```typescript
GET /api/pathao/track/:consignmentId

Response:
{
  "consignment_id": "D123456",
  "order_status": "Pickup Pending",
  "delivery_type": "normal",
  ...
}
```

## Integration Workflow

### Checkout Flow

1. **Customer fills shipping details**
   - City selection (from Pathao cities)
   - Zone selection (based on city)
   - Area selection (based on zone)

2. **Calculate delivery charge**
   - Call `/api/pathao/calculate-price` with:
     - Your store ID
     - Customer's city, zone
     - Delivery type preference
     - Estimated package weight

3. **Show total with delivery**
   - Display: Subtotal + Delivery Charge = Total

4. **Place order**
   - When customer confirms order:
     - Create order in your database
     - Call `/api/pathao/create-order` with customer and order details
     - Store the `consignment_id` with your order

5. **Confirmation**
   - Show customer the order confirmation
   - Include Pathao tracking ID
   - Send confirmation email with tracking link

### Order Tracking

- Use `/api/pathao/track/:consignmentId` to show delivery status
- Update order status in your database based on Pathao status

## Testing

### Development/Staging
Pathao provides a staging environment for testing:
- Base URL: `https://hermes-api.p-stageenv.xyz`
- Use test credentials from your merchant panel

### Production
- Base URL: `https://hermes-api.pathao.com`
- Use production credentials

## Common Issues & Solutions

### 1. Authentication Failed
- Verify CLIENT_ID and CLIENT_SECRET are correct
- Check username/password are correct
- Ensure credentials haven't expired

### 2. City/Zone/Area Not Found
- Make sure to call endpoints in order: cities → zones → areas
- Verify IDs are being passed correctly as integers

### 3. Price Calculation Fails
- Ensure store ID exists and is active
- Verify recipient city and zone are valid
- Check delivery type is either "normal" or "48"

### 4. Order Creation Fails
- Verify all required fields are provided
- Phone number must be valid Bangladesh number (11 digits)
- Amount to collect must be >= 0

## Best Practices

1. **Cache Location Data**
   - Cache cities, zones, areas in frontend to reduce API calls
   - Refresh every 24 hours or on app reload

2. **Error Handling**
   - Always validate user input before calling Pathao API
   - Show user-friendly error messages
   - Log errors for debugging

3. **Order Management**
   - Store consignment_id with each order
   - Implement webhook for order status updates (if supported)
   - Regularly sync order status for pending deliveries

4. **Performance**
   - Calculate delivery charge only when necessary (on zone change)
   - Debounce API calls for better UX
   - Use loading states during API calls

## Support

For Pathao API support:
- Documentation: Check merchant panel
- Support: Contact Pathao merchant support
- Email: merchant.support@pathao.com

## Next Steps

1. Get your API credentials from Pathao Merchant Dashboard
2. Add them to your `.env` file
3. Test the integration in staging environment
4. Update the frontend checkout page to use Pathao location selection
5. Deploy to production

---

Last Updated: 2026-01-19
