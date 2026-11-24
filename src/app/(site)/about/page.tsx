import type { Metadata } from 'next';
import { CenterGuide } from './center-guide';
import './about.css';

export const metadata: Metadata = { title: '센터 안내' };
export default function AboutPage() {
  return <CenterGuide />;
}
