import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jasurbek Barber | Admin Panel',
  description: 'Jasurbek Barber boshqaruv paneli — bronlar, mijozlar, jadval va CRM.',
  manifest: '/manifest-admin.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Barber Admin',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
