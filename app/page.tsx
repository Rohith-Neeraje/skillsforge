'use client';

import dynamic from 'next/dynamic';

const SkillsForgeApp = dynamic(() => import('../src/App'), { ssr: false });

export default function Page() {
  return <SkillsForgeApp />;
}
