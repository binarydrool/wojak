import CopyButton from "@/components/ui/CopyButton";
import {
  OG_WOJAK_CONTRACT,
  TWITTER_URL,
  TELEGRAM_URL,
  ETHERSCAN_TOKEN_URL,
} from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-wojak-border bg-wojak-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Community Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Community</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={TWITTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-wojak-green transition-colors"
                >
                  Twitter @WojakToken
                </a>
              </li>
              <li>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-wojak-green transition-colors"
                >
                  Telegram
                </a>
              </li>
              <li>
                <a
                  href={ETHERSCAN_TOKEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-wojak-green transition-colors"
                >
                  Etherscan
                </a>
              </li>
            </ul>
          </div>

          {/* Contract */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">OG Contract</h3>
            <CopyButton
              text={OG_WOJAK_CONTRACT}
              label={OG_WOJAK_CONTRACT}
              className="text-gray-400"
            />
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Disclaimer</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Do your own research. Verify everything on-chain. The blockchain doesn&apos;t lie.
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#4ade80" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="text-xs text-gray-500">binarydrool.eth</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-wojak-border text-center">
          <p className="text-xs text-gray-500">MIT License</p>
        </div>
      </div>
    </footer>
  );
}
