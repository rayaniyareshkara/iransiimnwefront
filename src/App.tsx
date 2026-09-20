/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RouterProvider, useRouter } from './router';
import { StoreHomeView } from './views/store/StoreHomeView';
import { StoreDetailsView } from './views/store/StoreDetailsView';
import { StoreCheckoutView } from './views/store/StoreCheckoutView';
import { StoreSuccessView } from './views/store/StoreSuccessView';
import { StorePaymentFailedView } from './views/store/StorePaymentFailedView';

const AppContent: React.FC = () => {
  const { path } = useRouter();

  if (path === '/store/details') {
    return <StoreDetailsView />;
  }

  if (path === '/store/checkout') {
    return <StoreCheckoutView />;
  }

  if (path === '/store/success') {
    return <StoreSuccessView />;
  }

  if (path === '/store/payment-failed') {
    return <StorePaymentFailedView />;
  }

  return <StoreHomeView />;
};

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
