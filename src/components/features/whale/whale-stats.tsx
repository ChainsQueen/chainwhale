'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Activity, DollarSign, Users, BarChart3 } from 'lucide-react';
import { AnimatedHover } from '@/components/ui/animated-hover';
import type { WhaleStats } from '@/core/services/whale-service';

interface WhaleStatsProps {
  stats: WhaleStats;
}

export function WhaleStatsComponent({ stats }: WhaleStatsProps) {
  const formatValue = (value: number) => {
    // Compact notation keeps long values readable in small cards
    const compact = Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
    return `$${compact}`;
  };

  const statCards = [
    {
      title: 'Total Transfers',
      value: stats.totalTransfers.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Total Volume',
      value: formatValue(stats.totalVolume),
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Largest Transfer',
      value: formatValue(stats.largestTransfer),
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400'
    },
    {
      title: 'Unique Whales',
      value: stats.uniqueWhales.toLocaleString(),
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="space-y-1">
        <AnimatedHover type="label">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Whale Activity Stats
          </h2>
        </AnimatedHover>
        <AnimatedHover type="label">
          <p className="text-xs text-muted-foreground">
            Summary of whale transfers in the selected time range
          </p>
        </AnimatedHover>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <AnimatedHover key={stat.title} type="stat">
          <Card className="border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-slate-500/5 to-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div
                className={`font-bold ${stat.color} leading-tight break-words break-all overflow-hidden`}
              >
                <span className="block text-xl sm:text-2xl md:text-3xl truncate">
                  {stat.value}
                </span>
              </div>
            </CardContent>
          </Card>
        </AnimatedHover>
      ))}
      </div>
    </div>
  );
}
