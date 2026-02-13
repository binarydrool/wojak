import {
  X_URL,
  TELEGRAM_COMMUNITY_URL,
  ETHERSCAN_TOKEN_URL,
} from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-wojak-border bg-wojak-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Community Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Community</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={X_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-wojak-green transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  @WojakToken
                </a>
              </li>
              <li>
                <a
                  href={TELEGRAM_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-wojak-green transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Telegram
                </a>
              </li>
              <li>
                <a
                  href={ETHERSCAN_TOKEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-wojak-green transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 123 123" fill="currentColor" className="w-4 h-4">
                    <path d="M25.79 58.4149c0-1.36.458-2.67 1.519-3.638.53-.48 1.1-.858 1.73-1.116.628-.258 1.3-.389 1.98-.386l8.59.028c1.37 0 2.683.544 3.652 1.513.968.968 1.512 2.282 1.512 3.651v32.48c.967-.287 2.209-.593 3.568-.913.944-.222 1.785-.756 2.387-1.516.603-.76.93-1.701.93-2.671V45.541c0-1.37.544-2.683 1.512-3.652.969-.968 2.282-1.512 3.652-1.513h8.607c1.37 0 2.683.544 3.652 1.513.968.968 1.512 2.282 1.512 3.652v37.393s2.155-.872 4.254-1.758c.78-.33 1.445-.882 1.913-1.587.469-.706.718-1.533.719-2.38V32.631c0-1.37.544-2.683 1.512-3.651.968-.969 2.282-1.513 3.651-1.513h8.607c1.37 0 2.683.544 3.652 1.513.968.968 1.512 2.281 1.512 3.651v36.709c7.462-5.408 15.024-11.912 21.025-19.733.871-1.135 1.447-2.468 1.677-3.88.23-1.412.107-2.859-.358-4.212-2.778-7.992-7.193-15.317-12.964-21.504-5.771-6.188-12.77-11.103-20.55-14.43C77.416 2.253 69.028.586 60.567.686c-8.46.1-16.807 1.966-24.505 5.478-7.698 3.511-14.579 8.591-20.201 14.914-5.622 6.323-9.863 13.75-12.45 21.806C.824 50.94-.053 59.447.837 67.862c.89 8.414 3.526 16.55 7.74 23.887.734 1.265 1.814 2.295 3.113 2.969 1.3.673 2.764.961 4.221.831 1.628-.143 3.655-.346 6.065-.629 1.05-.12 2.018-.62 2.722-1.407.703-.788 1.093-1.806 1.093-2.862V58.415z" />
                    <path d="M25.602 110.51c9.072 6.6 19.794 10.562 30.978 11.447 11.185.884 22.396-1.342 32.393-6.434 9.998-5.092 18.391-12.85 24.253-22.416 5.861-9.567 8.962-20.568 8.959-32.787 0-1.4-.065-2.785-.158-4.162C99.808 90.296 58.783 105.788 25.604 110.505" />
                  </svg>
                  Etherscan
                </a>
              </li>
            </ul>
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
