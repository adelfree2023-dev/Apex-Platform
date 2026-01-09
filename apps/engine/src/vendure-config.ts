import {
    VendureConfig,
    DefaultJobQueuePlugin,
    DefaultSearchPlugin,
    LanguageCode,
    NativeAuthenticationStrategy,
    PaymentMethodHandler,
} from '@vendure/core';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { ChannelRestrictedAuthStrategy } from './strategies/channel-restricted-auth.strategy';
import path from 'path';

const IS_DEV = process.env.NODE_ENV !== 'production';

// ============================================
// PAYMENT HANDLERS - 8 طرق دفع
// ============================================

// 1️⃣ الدفع عند الاستلام (COD)
const codPaymentHandler = new PaymentMethodHandler({
    code: 'cod',
    description: [{
        languageCode: LanguageCode.ar,
        value: 'الدفع عند الاستلام',
    }, {
        languageCode: LanguageCode.en,
        value: 'Cash on Delivery',
    }],
    args: {},
    createPayment: async (ctx, order, amount, args, metadata) => {
        return {
            amount,
            state: 'Settled' as const,
            transactionId: `COD-${order.code}-${Date.now()}`,
            metadata: {
                method: 'cash',
                orderCode: order.code,
            },
        };
    },
    settlePayment: async () => ({ success: true }),
});

// 2️⃣ InstaPay - تحويل فوري
const instaPayHandler = new PaymentMethodHandler({
    code: 'instapay',
    description: [{
        languageCode: LanguageCode.ar,
        value: 'انستاباي - تحويل فوري',
    }],
    args: {
        iban: { type: 'string', label: [{ languageCode: LanguageCode.ar, value: 'رقم IBAN' }] },
        accountName: { type: 'string', label: [{ languageCode: LanguageCode.ar, value: 'اسم الحساب' }] },
    },
    createPayment: async (ctx, order, amount, args, metadata) => {
        return {
            amount,
            state: 'Authorized' as const,
            transactionId: `INSTA-${order.code}-${Date.now()}`,
            metadata: {
                iban: args.iban || process.env.INSTAPAY_IBAN,
                accountName: args.accountName || process.env.INSTAPAY_ACCOUNT_NAME,
                instructions: `حوّل ${amount / 100} جنيه عبر انستاباي - المرجع: ${order.code}`,
            },
        };
    },
    settlePayment: async () => ({ success: true }),
});

// 3️⃣ فودافون كاش
const vodafoneCashHandler = new PaymentMethodHandler({
    code: 'vodafone-cash',
    description: [{
        languageCode: LanguageCode.ar,
        value: 'فودافون كاش',
    }],
    args: {
        walletNumber: { type: 'string', label: [{ languageCode: LanguageCode.ar, value: 'رقم المحفظة' }] },
    },
    createPayment: async (ctx, order, amount, args, metadata) => {
        const wallet = args.walletNumber || process.env.VODAFONE_CASH_NUMBER;
        return {
            amount,
            state: 'Authorized' as const,
            transactionId: `VF-${order.code}-${Date.now()}`,
            metadata: {
                walletNumber: wallet,
                instructions: `حوّل ${amount / 100} جنيه إلى فودافون كاش: ${wallet} - المرجع: ${order.code}`,
            },
        };
    },
    settlePayment: async () => ({ success: true }),
});

// 4️⃣ اتصالات كاش
const etisalatCashHandler = new PaymentMethodHandler({
    code: 'etisalat-cash',
    description: [{
        languageCode: LanguageCode.ar,
        value: 'اتصالات كاش',
    }],
    args: {
        walletNumber: { type: 'string', label: [{ languageCode: LanguageCode.ar, value: 'رقم المحفظة' }] },
    },
    createPayment: async (ctx, order, amount, args, metadata) => {
        const wallet = args.walletNumber || process.env.ETISALAT_CASH_NUMBER;
        return {
            amount,
            state: 'Authorized' as const,
            transactionId: `ET-${order.code}-${Date.now()}`,
            metadata: {
                walletNumber: wallet,
                instructions: `حوّل ${amount / 100} جنيه إلى اتصالات كاش: ${wallet} - المرجع: ${order.code}`,
            },
        };
    },
    settlePayment: async () => ({ success: true }),
});

// 5️⃣ أورنج كاش
const orangeCashHandler = new PaymentMethodHandler({
    code: 'orange-cash',
    description: [{
        languageCode: LanguageCode.ar,
        value: 'أورنج كاش',
    }],
    args: {
        walletNumber: { type: 'string', label: [{ languageCode: LanguageCode.ar, value: 'رقم المحفظة' }] },
    },
    createPayment: async (ctx, order, amount, args, metadata) => {
        const wallet = args.walletNumber || process.env.ORANGE_CASH_NUMBER;
        return {
            amount,
            state: 'Authorized' as const,
            transactionId: `OR-${order.code}-${Date.now()}`,
            metadata: {
                walletNumber: wallet,
                instructions: `حوّل ${amount / 100} جنيه إلى أورنج كاش: ${wallet} - المرجع: ${order.code}`,
            },
        };
    },
    settlePayment: async () => ({ success: true }),
});

// 6️⃣ فوري
const fawryHandler = new PaymentMethodHandler({
    code: 'fawry',
    description: [{
        languageCode: LanguageCode.ar,
        value: 'فوري',
    }],
    args: {},
    createPayment: async (ctx, order, amount, args, metadata) => {
        // Generate Fawry reference code
        const fawryCode = `FWR${order.code}${Date.now().toString().slice(-6)}`;
        return {
            amount,
            state: 'Authorized' as const,
            transactionId: fawryCode,
            metadata: {
                fawryCode,
                instructions: `ادفع في أي فرع فوري - كود الدفع: ${fawryCode} - المبلغ: ${amount / 100} جنيه`,
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
            },
        };
    },
    settlePayment: async () => ({ success: true }),
});

// ============================================
// VENDURE CONFIG
// ============================================

export const config: VendureConfig = {
    apiOptions: {
        port: 3001,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        adminApiPlayground: IS_DEV,
        shopApiPlayground: IS_DEV,
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        requireVerification: false,
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME || 'superadmin',
            password: process.env.SUPERADMIN_PASSWORD || 'superadmin',
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET || 'change-me-in-production',
        },
        shopAuthenticationStrategy: [
            new ChannelRestrictedAuthStrategy(),
        ],
        adminAuthenticationStrategy: [
            new NativeAuthenticationStrategy(),
        ],
    },
    customFields: {
        // Customer fields
        Customer: [
            {
                name: 'street',
                type: 'string',
                label: [{ languageCode: LanguageCode.en, value: 'Street Address' }],
                nullable: true,
                public: true,
            },
            {
                name: 'province',
                type: 'string',
                label: [{ languageCode: LanguageCode.en, value: 'Province/Governorate' }],
                nullable: true,
                public: true,
            },
        ],
        // Order fields - لحفظ ملاحظات التوصيل
        Order: [
            {
                name: 'deliveryNotes',
                type: 'text',
                label: [
                    { languageCode: LanguageCode.en, value: 'Delivery Notes' },
                    { languageCode: LanguageCode.ar, value: 'ملاحظات التوصيل' },
                ],
                nullable: true,
                public: true,
            },
            {
                name: 'buildingDetails',
                type: 'string',
                label: [
                    { languageCode: LanguageCode.en, value: 'Building Details' },
                    { languageCode: LanguageCode.ar, value: 'تفاصيل المبنى (عمارة/دور/شقة)' },
                ],
                nullable: true,
                public: true,
            },
        ],
    },
    dbConnectionOptions: {
        type: 'postgres',
        synchronize: false,
        migrations: [path.join(__dirname, 'migrations/*.ts')],
        logging: IS_DEV,
        database: process.env.DB_NAME || 'vendure',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5433,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    },
    paymentOptions: {
        paymentMethodHandlers: [
            codPaymentHandler,
            instaPayHandler,
            vodafoneCashHandler,
            etisalatCashHandler,
            orangeCashHandler,
            fawryHandler,
        ],
    },
    plugins: [
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
        }),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),

        AdminUiPlugin.init({
            route: 'admin',
            port: 3002,
            adminUiConfig: {
                brand: 'Apex Platform',
                hideVersion: false,
            },
        }),
    ],
};
