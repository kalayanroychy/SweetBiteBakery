import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Pathao types
export type PathaoCity = {
    city_id: number;
    city_name: string;
};

export type PathaoZone = {
    zone_id: number;
    zone_name: string;
    city_id: number;
};

export type PathaoArea = {
    area_id: number;
    area_name: string;
    zone_id: number;
    city_id: number;
    post_code?: string;
};

export type PathaoStore = {
    store_id: number;
    store_name: string;
    store_address: string;
    city_id: number;
    zone_id: number;
    area_id: number;
};

export type PathaoPrice = {
    price: number;
    cod_charge: number;
    promo_discount: number;
    total_price: number;
};

// Hook to fetch cities
export function usePathaoCities() {
    return useQuery<PathaoCity[]>({
        queryKey: ["/api/pathao/cities"],
        staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    });
}

// Hook to fetch zones for a city
export function usePathaoZones(cityId: number | null) {
    return useQuery<PathaoZone[]>({
        queryKey: [`/api/pathao/zones/${cityId}`],
        enabled: !!cityId && cityId > 0,
        staleTime: 24 * 60 * 60 * 1000,
    });
}

// Hook to fetch areas for a zone
export function usePathaoAreas(zoneId: number | null) {
    return useQuery<PathaoArea[]>({
        queryKey: [`/api/pathao/areas/${zoneId}`],
        enabled: !!zoneId && zoneId > 0,
        staleTime: 24 * 60 * 60 * 1000,
    });
}

// Hook to fetch stores
export function usePathaoStores() {
    return useQuery<PathaoStore[]>({
        queryKey: ["/api/pathao/stores"],
        staleTime: 24 * 60 * 60 * 1000,
    });
}

// Function to calculate price
export async function calculatePathaoPrice(params: {
    storeId: number;
    recipientCity: number;
    recipientZone: number;
    deliveryType?: "normal" | "48";
    itemType?: "parcel" | "document";
    itemWeight?: number;
}): Promise<PathaoPrice> {
    const response = await apiRequest("POST", "/api/pathao/calculate-price", params);
    return response.json();
}

// Function to create Pathao order
export async function createPathaoOrder(orderData: {
    storeId: number;
    merchantOrderId: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    recipientCity: number;
    recipientZone: number;
    recipientArea: number;
    deliveryType: "normal" | "48";
    itemType: "parcel" | "document";
    itemQuantity: number;
    itemWeight: number;
    itemDescription: string;
    amountToCollect: number;
    specialInstruction?: string;
}) {
    const response = await apiRequest("POST", "/api/pathao/create-order", orderData);
    return response.json();
}
