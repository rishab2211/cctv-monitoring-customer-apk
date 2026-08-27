import { baseApi } from '../../api/rtk-query/baseApi';
import { Subscription } from '../../types';

export interface Plan {
  _id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  isPopular?: boolean;
}

export interface PlansResponse {
  success: boolean;
  data: {
    plans: Plan[];
  };
}

export interface CustomerSubscriptionResponse {
  success: boolean;
  data: Subscription & {
    planName?: string;
    daysRemaining?: number;
    totalDays?: number;
  };
}

export interface CreateSubscriptionResponse {
  success: boolean;
  data: {
    subscription: {
      _id: string;
      status: string;
      amount: number;
    };
    invoice?: {
      _id: string;
      amount: number;
      status: string;
    };
  };
}

export interface CreatePaymentOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    amount: number;
    currency: string;
    razorpayKeyId: string;
    subscriptionId: string;
  };
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  billingDate: string;
  dueDate?: string;
  paidAt?: string;
  pdfUrl?: string;
  lineItems?: Array<{
    description: string;
    amount: number;
  }>;
  subtotal?: number;
  tax?: number;
}

export interface InvoicesResponse {
  success: boolean;
  data: {
    invoices: Invoice[];
  };
}

export interface InvoiceDetailResponse {
  success: boolean;
  data: Invoice;
}

export interface PaymentTransaction {
  _id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded';
  createdAt: string;
  method?: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  data: {
    payments: PaymentTransaction[];
  };
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get public plans
    getPlans: builder.query<PlansResponse, void>({
      query: () => ({
        url: '/plans',
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        let rawPlans: any[] = [];
        if (Array.isArray(response)) {
          rawPlans = response;
        } else if (Array.isArray(response?.data)) {
          rawPlans = response.data;
        } else if (Array.isArray(response?.data?.plans)) {
          rawPlans = response.data.plans;
        } else if (Array.isArray(response?.plans)) {
          rawPlans = response.plans;
        }

        const plans: Plan[] = rawPlans.map((p: any) => ({
          _id: p._id || p.id || '',
          name: p.name || 'Security Plan',
          price: typeof p.price === 'number' ? p.price : Number(p.price) || 0,
          currency: p.currency || 'INR',
          billingCycle: p.billingCycle || 'monthly',
          features: Array.isArray(p.features) ? p.features : [],
          isPopular: !!p.isPopular,
        }));

        return {
          success: true,
          data: {
            plans,
          },
        };
      },
      providesTags: ['Billing'],
    }),

    // 2. Get customer subscription
    getCustomerSubscription: builder.query<CustomerSubscriptionResponse, void>({
      query: () => ({
        url: '/customer/subscription',
        method: 'GET',
      }),
      providesTags: ['Billing', 'Dashboard'],
    }),

    // 3. Create new subscription (pending payment)
    createSubscription: builder.mutation<CreateSubscriptionResponse, { planId: string }>({
      query: (body) => ({
        url: '/subscriptions',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Billing'],
    }),

    // 4. Cancel active subscription (auto-resolves active subscription)
    cancelSubscription: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/customer/cancel-subscription',
        method: 'POST',
      }),
      invalidatesTags: ['Billing', 'Dashboard'],
    }),

    // 5. Renew past-due subscription
    renewSubscription: builder.mutation<CreateSubscriptionResponse, { subscriptionId: string }>({
      query: ({ subscriptionId }) => ({
        url: `/subscriptions/${subscriptionId}/renew`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Billing'],
    }),

    // 6. Create Razorpay Payment Order
    createPaymentOrder: builder.mutation<CreatePaymentOrderResponse, { subscriptionId: string }>({
      query: (body) => ({
        url: '/payments/create-order',
        method: 'POST',
        data: body,
      }),
    }),

    // 7. Verify Razorpay Payment Signature
    verifyPayment: builder.mutation<{ success: boolean; data: any }, VerifyPaymentRequest>({
      query: (body) => ({
        url: '/payments/verify',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Billing', 'Dashboard'],
    }),

    // 8. Get customer invoices
    getCustomerInvoices: builder.query<InvoicesResponse, void>({
      query: () => ({
        url: '/customer/invoices',
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        let invoices: Invoice[] = [];
        if (Array.isArray(response)) {
          invoices = response;
        } else if (Array.isArray(response?.data)) {
          invoices = response.data;
        } else if (Array.isArray(response?.data?.invoices)) {
          invoices = response.data.invoices;
        } else if (Array.isArray(response?.invoices)) {
          invoices = response.invoices;
        }

        return {
          success: true,
          data: {
            invoices,
          },
        };
      },
      providesTags: ['Billing'],
    }),

    // 9. Get invoice detail
    getInvoiceDetail: builder.query<InvoiceDetailResponse, string>({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Billing', id }],
    }),

    // 10. Get payment transactions history
    getPaymentHistory: builder.query<PaymentHistoryResponse, void>({
      query: () => ({
        url: '/customer/payments',
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        let payments: PaymentTransaction[] = [];
        if (Array.isArray(response)) {
          payments = response;
        } else if (Array.isArray(response?.data)) {
          payments = response.data;
        } else if (Array.isArray(response?.data?.payments)) {
          payments = response.data.payments;
        } else if (Array.isArray(response?.payments)) {
          payments = response.payments;
        }

        return {
          success: true,
          data: {
            payments,
          },
        };
      },
      providesTags: ['Billing'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetPlansQuery,
  useGetCustomerSubscriptionQuery,
  useCreateSubscriptionMutation,
  useCancelSubscriptionMutation,
  useRenewSubscriptionMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useGetCustomerInvoicesQuery,
  useGetInvoiceDetailQuery,
  useGetPaymentHistoryQuery,
} = billingApi;
