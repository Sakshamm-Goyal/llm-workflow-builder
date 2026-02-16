'use client';

import { FlowVisual } from './FlowVisual';

export function LandingHero() {
    return (
        <section className="px-22 pb-20 pt-20 lg:pt-19 relative">
            <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-12 lg:gap-30 relative z-10">
                {/* Left Column: WEAVY */}
                <div className="flex flex-col">
                    <h1 className="text-[94px] lg:text-[94px] leading-[0.85] tracking-tight text-black font-dm-regular font-normal">
                        Weavy
                    </h1>
                </div>

                {/* Right Column: Artistic Intelligence */}
                <div className="flex flex-col pt-4 lg:pt-0">
                    <h2 className="text-[120px] lg:text-[94px] leading-[0.9] tracking-tight text-black mb-8 font-dm-regular font-normal">
                        Artistic Intelligence
                    </h2>
                    <p className="text-[18px] lg:text-[18px] text-black/70 max-w-lg leading-[1.1] tracking-tighter font-medium font-dm-regular">
                        Turn your creative vision into scalable workflows.<br />
                        Access all AI models and professional editing tools<br />
                        in one node based platform.
                    </p>
                </div>
            </div>

            {/* Flow Visual */}
            <FlowVisual />

            {/* Grid Background */}
            <div className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
                }}
            />
        </section>
    );
}
