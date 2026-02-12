"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GamesDropdown from "./GamesDropdown";
import { SITE_TAGLINE } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/crypto-101", label: "Crypto 101" },
  { href: "/migration-report", label: "Migration Report", notify: true },
  { href: "/wojak-tv", label: "Wojak TV" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-wojak-dark/95 backdrop-blur-md border-b border-wojak-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Tagline */}
          <Link href="/" className="flex items-center gap-3 shrink-0" onClick={closeMobileMenu}>
            <span className="text-xl font-bold text-white tracking-tight">WOJAK</span>
            <span className="hidden sm:block text-xs text-gray-400">{SITE_TAGLINE}</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm transition-colors ${
                  pathname === link.href
                    ? "text-white font-medium"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {link.label}
                {link.notify && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-wojak-green rounded-full animate-notification-pulse" />
                )}
              </Link>
            ))}
            <GamesDropdown />
          </div>

          {/* Mobile: Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-gray-300 hover:text-white p-2"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-wojak-border py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={`relative block px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? "text-white bg-white/5 font-medium"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
                {link.notify && (
                  <span className="inline-block ml-2 w-2 h-2 bg-wojak-green rounded-full animate-notification-pulse" />
                )}
              </Link>
            ))}
            <div className="px-3 py-2">
              <GamesDropdown onGameOpen={closeMobileMenu} mobile />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
