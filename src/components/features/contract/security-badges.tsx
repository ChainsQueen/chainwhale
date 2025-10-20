import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, AlertTriangle, FileCode } from 'lucide-react';

/**
 * Props for SecurityBadges component
 */
interface SecurityBadgesProps {
  /** Whether the contract is verified on block explorer */
  isVerified?: boolean;
  /** Whether the contract is a proxy contract */
  isProxy?: boolean;
  /** Token standard type (e.g., 'ERC-20', 'ERC-721') */
  tokenType?: string;
  /** Whether the contract is flagged as a scam */
  isScam?: boolean;
  /** Contract reputation status from security analysis */
  reputation?: string;
  /** Whether security data is still loading */
  loading?: boolean;
}

/**
 * Displays security and verification badges for smart contracts
 * 
 * Shows comprehensive security information including:
 * - Verification status (verified/not verified/unknown)
 * - Proxy contract detection with warning
 * - Token type badge (ERC-20, ERC-721, etc.)
 * - Scam warning badge (critical alert)
 * - Reputation badges for suspicious contracts
 * 
 * Badges are color-coded:
 * - Green: Verified and safe
 * - Red: Not verified or scam warning
 * - Orange: Proxy contract (requires caution)
 * - Yellow: Reputation warnings
 * - Gray: Unknown status
 * 
 * @component
 * 
 * @example
 * // Verified ERC-20 token
 * <SecurityBadges
 *   isVerified={true}
 *   tokenType="ERC-20"
 *   isProxy={false}
 * />
 * 
 * @example
 * // Scam warning
 * <SecurityBadges
 *   isVerified={false}
 *   isScam={true}
 *   reputation="suspicious"
 * />
 * 
 * @example
 * // Loading state
 * <SecurityBadges loading={true} />
 */
export function SecurityBadges({
  isVerified,
  isProxy,
  tokenType,
  isScam,
  reputation,
  loading = false,
}: SecurityBadgesProps) {
  if (loading) {
    return (
      <Badge variant="outline" className="gap-1">
        <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Loading...
      </Badge>
    );
  }

  return (
    <>
      {/* Verification Badge */}
      {isVerified === true ? (
        <Badge className="gap-1 bg-green-500 hover:bg-green-600">
          <ShieldCheck className="h-3 w-3" />
          Verified
        </Badge>
      ) : isVerified === false ? (
        <Badge variant="destructive" className="gap-1">
          <ShieldAlert className="h-3 w-3" />
          Not Verified
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <ShieldAlert className="h-3 w-3" />
          Verification Unknown
        </Badge>
      )}

      {/* Proxy Badge */}
      {isProxy && (
        <Badge variant="outline" className="gap-1 border-orange-500 text-orange-500">
          <AlertTriangle className="h-3 w-3" />
          Proxy Contract
        </Badge>
      )}

      {/* Token Type Badge */}
      {tokenType && (
        <Badge variant="secondary" className="gap-1">
          <FileCode className="h-3 w-3" />
          {tokenType}
        </Badge>
      )}

      {/* Scam Warning Badge */}
      {isScam && (
        <Badge variant="destructive" className="gap-1 bg-red-600 hover:bg-red-700">
          <AlertTriangle className="h-3 w-3" />
          SCAM WARNING
        </Badge>
      )}

      {/* Reputation Badge */}
      {reputation && reputation !== 'ok' && (
        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-500">
          <AlertTriangle className="h-3 w-3" />
          {reputation.toUpperCase()}
        </Badge>
      )}
    </>
  );
}