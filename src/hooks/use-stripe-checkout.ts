import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutOptions {
  customerEmail?: string;
  clientReferenceId?: string;
}

export const useStripeCheckout = () => {
  const redirectToCheckout = async (priceId: string, options: CheckoutOptions = {}) => {
    try {
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      if (!priceId) {
        throw new Error('Price ID is required');
      }

      // Show loading toast
      toast.loading('Redirecting to checkout...', { id: 'checkout-loading' });

      // All prices are now recurring subscriptions (both monthly and annual)
      const checkoutMode = 'subscription';

      const { error } = await stripe.redirectToCheckout({
        lineItems: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: checkoutMode,
        successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
        customerEmail: options.customerEmail,
        clientReferenceId: options.clientReferenceId,
      });

      // Dismiss loading toast
      toast.dismiss('checkout-loading');

      if (error) {
        console.error('Stripe checkout error:', error);
        toast.error('Failed to redirect to checkout. Please try again.');
        throw error;
      }
    } catch (error) {
      toast.dismiss('checkout-loading');
      console.error('Checkout error:', error);
      toast.error('Something went wrong. Please try again.');
      throw error;
    }
  };

  return {
    redirectToCheckout,
  };
};