// Pathao Courier API Integration
// Documentation: https://merchant.pathao.com/docs/api

import https from 'https';
import http from 'http';

type PathaoConfig = {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
    baseUrl: string;
    storeId?: number;
};

type PathaoCity = {
    city_id: number;
    city_name: string;
};

type PathaoZone = {
    zone_id: number;
    zone_name: string;
    city_id: number;
};

type PathaoArea = {
    area_id: number;
    area_name: string;
    zone_id: number;
    city_id: number;
    post_code?: string;
};

type PathaoStore = {
    store_id: number;
    store_name: string;
    store_address: string;
    city_id: number;
    zone_id: number;
    area_id: number;
};

type PathaoOrderResponse = {
    type: string;
    code: number;
    message: string;
    data: {
        consignment_id: string;
        merchant_order_id: string;
        order_status: string;
        invoice_id: string;
    };
};

type PathaoPrice = {
    price: number;
    cod_charge: number;
    promo_discount: number;
    total_price: number;
};

class PathaoService {
    private config: PathaoConfig;
    private accessToken: string | null = null;
    private tokenExpiry: number | null = null;

    constructor(config: PathaoConfig) {
        this.config = {
            ...config,
            baseUrl: config.baseUrl || "https://hermes-api.pathao.com",
        };
    }

    // Helper to make HTTP/HTTPS requests
    private makeHttpRequest(url: string, options: any, postData?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https : http;

            const requestOptions = {
                ...options,
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
            };

            const req = client.request(requestOptions, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({ status: res.statusCode, data: jsonData, raw: data });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: null, raw: data });
                    }
                });
            });

            req.on('error', (error) => {
                console.error('HTTP Request Error:', error);
                reject(error);
            });

            if (postData) {
                req.write(postData);
            }

            req.end();
        });
    }

    // Authenticate and get access token
    private async authenticate(): Promise<string> {
        // Check if token is still valid (with 5-minute buffer)
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
            return this.accessToken;
        }

        console.log('[Pathao] Authenticating...');
        console.log('[Pathao] Using base URL:', this.config.baseUrl);

        const authData = JSON.stringify({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            username: this.config.username,
            password: this.config.password,
            grant_type: "password",
        });

        // Pathao uses Aladdin API for authentication
        const authEndpoint = `${this.config.baseUrl}/aladdin/api/v1/issue-token`;
        console.log('[Pathao] Auth endpoint:', authEndpoint);

        const result = await this.makeHttpRequest(
            authEndpoint,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Content-Length': Buffer.byteLength(authData),
                },
            },
            authData
        );

        console.log('[Pathao] Auth status:', result.status);

        if (result.status !== 200) {
            console.error('[Pathao] Auth failed response:', result.raw);
            throw new Error(`Pathao authentication failed: ${result.status} - ${result.raw}`);
        }

        if (!result.data || !result.data.access_token) {
            console.error('[Pathao] No access token in response:', result.raw);
            throw new Error("Pathao API did not return an access token");
        }

        this.accessToken = result.data.access_token;
        this.tokenExpiry = Date.now() + ((result.data.expires_in || 86400) * 1000);

        console.log('[Pathao] Authenticated successfully');

        if (!this.accessToken) {
            throw new Error("Failed to set access token");
        }

        return this.accessToken;
    }

    // Make authenticated API request  
    private async makeRequest(endpoint: string, options: { method?: string; body?: any } = {}): Promise<any> {
        const token = await this.authenticate();

        if (!token) {
            throw new Error("Failed to obtain Pathao access token");
        }

        const postData = options.body ? JSON.stringify(options.body) : undefined;
        const headers: any = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        if (postData) {
            headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const result = await this.makeHttpRequest(
            `${this.config.baseUrl}${endpoint}`,
            {
                method: options.method || 'GET',
                headers,
            },
            postData
        );

        if (result.status && result.status >= 400) {
            throw new Error(`Pathao API error: ${result.status} - ${result.raw}`);
        }

        return result.data;
    }

    // Get list of cities
    async getCities(): Promise<PathaoCity[]> {
        const data = await this.makeRequest("/aladdin/api/v1/city-list");
        // Response is: { data: { data: [...] } }
        return data.data?.data || [];
    }

    // Get zones for a city
    async getZones(cityId: number): Promise<PathaoZone[]> {
        const data = await this.makeRequest(`/aladdin/api/v1/cities/${cityId}/zone-list`);
        return data.data?.data || [];
    }

    // Get areas for a zone
    async getAreas(zoneId: number): Promise<PathaoArea[]> {
        const data = await this.makeRequest(`/aladdin/api/v1/zones/${zoneId}/area-list`);
        return data.data?.data || [];
    }

    // Get merchant stores
    async getStores(): Promise<PathaoStore[]> {
        const data = await this.makeRequest("/aladdin/api/v1/stores");
        return data.data?.data || [];
    }

    // Calculate delivery price
    async calculatePrice(params: {
        storeId: number;
        recipientCity: number;
        recipientZone: number;
        deliveryType: "48" | "normal";
        itemType: "parcel" | "document";
        item_weight?: number;
    }): Promise<PathaoPrice> {
        const data = await this.makeRequest("/aladdin/api/v1/merchant/price-plan", {
            method: "POST",
            body: {
                store_id: params.storeId,
                item_type: params.itemType,
                delivery_type: params.deliveryType,
                item_weight: params.item_weight || 0.5,
                recipient_city: params.recipientCity,
                recipient_zone: params.recipientZone,
            },
        });

        return {
            price: data.data?.price || 0,
            cod_charge: data.data?.cod_charge || 0,
            promo_discount: data.data?.promo_discount || 0,
            total_price: data.data?.total_fee || 0,
        };
    }

    // Create order/parcel
    async createOrder(orderData: {
        storeId: number;
        merchantOrderId: string;
        recipientName: string;
        recipientPhone: string;
        recipientAddress: string;
        recipientCity: number;
        recipientZone: number;
        recipientArea: number;
        deliveryType: "48" | "normal";
        itemType: "parcel" | "document";
        itemQuantity: number;
        itemWeight: number;
        itemDescription: string;
        amountToCollect: number;
        specialInstruction?: string;
    }): Promise<PathaoOrderResponse> {
        const data = await this.makeRequest("/aladdin/api/v1/orders", {
            method: "POST",
            body: {
                store_id: orderData.storeId,
                merchant_order_id: orderData.merchantOrderId,
                recipient_name: orderData.recipientName,
                recipient_phone: orderData.recipientPhone,
                recipient_address: orderData.recipientAddress,
                recipient_city: orderData.recipientCity,
                recipient_zone: orderData.recipientZone,
                recipient_area: orderData.recipientArea,
                delivery_type: orderData.deliveryType,
                item_type: orderData.itemType,
                item_quantity: orderData.itemQuantity,
                item_weight: orderData.itemWeight,
                item_description: orderData.itemDescription,
                amount_to_collect: orderData.amountToCollect,
                special_instruction: orderData.specialInstruction || "",
            },
        });

        return data;
    }

    // Track order
    async trackOrder(consignmentId: string): Promise<any> {
        const data = await this.makeRequest(`/aladdin/api/v1/orders/${consignmentId}`);
        return data.data;
    }
}

// Export singleton instance
let pathaoService: PathaoService | null = null;

export function getPathaoService(): PathaoService {
    if (!pathaoService) {
        // Get credentials from environment variables
        const config: PathaoConfig = {
            clientId: process.env.PATHAO_CLIENT_ID || "",
            clientSecret: process.env.PATHAO_CLIENT_SECRET || "",
            username: process.env.PATHAO_USERNAME || "probashibakery@gmail.com",
            password: process.env.PATHAO_PASSWORD || "Probashi1234@",
            baseUrl: process.env.PATHAO_BASE_URL || "https://api-hermes.pathao.com",
            storeId: process.env.PATHAO_STORE_ID ? parseInt(process.env.PATHAO_STORE_ID) : undefined,
        };

        console.log('[Pathao] Initializing service with config:', {
            baseUrl: config.baseUrl,
            clientId: config.clientId ? 'Present' : 'Missing',
            hasCredentials: !!(config.clientId && config.clientSecret)
        });

        pathaoService = new PathaoService(config);
    }

    return pathaoService;
}

export { PathaoService, type PathaoCity, type PathaoZone, type PathaoArea, type PathaoStore, type PathaoPrice, type PathaoOrderResponse };
