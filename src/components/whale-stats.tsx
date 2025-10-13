'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Activity, DollarSign, Users } from 'lucide-react';
import type { WhaleStats } from '@/core/services/whale-service';

interface WhaleStatsProps {
  stats: WhaleStats;
}

export function WhaleStatsComponent({ stats }: WhaleStatsProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
