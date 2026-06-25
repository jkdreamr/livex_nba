import type { Metadata } from 'next';
import { MyLookExperience } from '@/components/my-look/MyLookExperience';

export const metadata: Metadata = {
  title: 'My Look | NBA Summer League x LiveX',
  description: 'Preview your Summer League hoodie with a local camera try-on.',
};

export default function MyLookPage() {
  return <MyLookExperience />;
}
