import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, AlertTriangle, FileCode } from 'lucide-react';

interface SecurityBadgesProps {
  isVerified?: boolean;
  isProxy?: boolean;
  tokenType?: string;
  isScam?: boolean;
  reputation?: string;
  loading?: boolean;
}

/**
 * Displays security-related badges for a contract
 * Shows verification status, proxy detection, token type, scam warnings, and reputation
 * 
 * @example
 * <SecurityBadges
 *   isVerified={true}
 *   isProxy={false}
 *   tokenType="ERC-20"
 *   isScam={false}
 * />
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