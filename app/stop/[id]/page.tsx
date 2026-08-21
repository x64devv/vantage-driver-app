/* ⚠⚠ `output: 'export'` will not emit a dynamic segment without this. Every stop
 * id has to be named at build time or /stop/4/ simply does not exist in out/.
 * The same three lines appear on the proof, cash, failed and closed pages. */

import { STOPS } from '@/lib/run';
import StopView from './StopView';

export function generateStaticParams() {
  return STOPS.map((s) => ({ id: String(s.id) }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StopView id={Number(id)} />;
}
