import { STOPS } from '@/lib/run';
import ClosedView from './ClosedView';

export function generateStaticParams() {
  return STOPS.map((s) => ({ id: String(s.id) }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClosedView id={Number(id)} />;
}
