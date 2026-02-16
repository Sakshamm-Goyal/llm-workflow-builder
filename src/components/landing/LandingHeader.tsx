'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';

export function LandingHeader() {
    const [isAnnounceVisible, setIsAnnounceVisible] = useState(true);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 font-dm-regular flex flex-col">
            {/* Top Announcement Bar */}
            {isAnnounceVisible && (
                <div className="bg-black text-white text-[12px] h-13 flex items-center justify-center relative px-4">
                    <span className="font-medium tracking-wide">Weavy is now a part of Figma</span>
                    <button
                        onClick={() => setIsAnnounceVisible(false)}
                        className="absolute right-4 p-1 opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Main Header Content */}
            <div className="bg-[#EAEAEA]/80 backdrop-blur-sm pt-0 pb-0 transition-all">
                <div className="w-full flex items-start justify-between">
                    {/* Left: Branding */}
                    <div className="flex items-start">
                        <Image
                            src="/logo2.svg"
                            alt="Weavy"
                            width={140}
                            height={40}
                            className="w-auto h-10 object-contain -mt-1 -ml-1"
                            style={{ filter: 'brightness(0)' }}
                            priority
                        />
                    </div>

                    {/* Right: Navigation */}
                    <div className="flex items-start gap-4 pr-0">
                        <nav className="hidden md:flex items-center gap-2 font-semibold text-[12px] tracking-normal text-black/80 mt-1">
                            <Link href="#collective" className="px-3 py-2 rounded-md hover:bg-black hover:text-white transition-all uppercase">COLLECTIVE</Link>
                            <Link href="#enterprise" className="px-3 py-2 rounded-md hover:bg-black hover:text-white transition-all uppercase">ENTERPRISE</Link>
                            <Link href="#pricing" className="px-3 py-2 rounded-md hover:bg-black hover:text-white transition-all uppercase">PRICING</Link>
                            <Link href="#demo" className="px-3 py-2 rounded-md hover:bg-black hover:text-white transition-all uppercase">REQUEST A DEMO</Link>
                            <Link href="/sign-in" className="px-3 py-2 rounded-md hover:bg-black hover:text-white transition-all uppercase">SIGN IN</Link>
                        </nav>
                        <Link
                            href="/sign-up"
                            className="bg-[#F7FF9F] hover:bg-[#252525] text-black hover:text-white font-normal pl-3 pr-6 pt-8 pb-3 transition-colors rounded-bl-lg text-[30px] leading-none flex justify-start shadow-sm"
                        >
                            Start Now
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
