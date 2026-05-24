"use client";

import { IndianRupee, Layers3, School, TrendingUp } from "lucide-react";

interface Props {
  fees: any[];
}

export default function FeesKPISection({ fees }: Props) {
  const totalRevenue = fees.reduce((acc, fee) => acc + fee.annualFees, 0);

  const avgFees = fees.length > 0 ? Math.round(totalRevenue / fees.length) : 0;

  const highestFees =
    fees.length > 0 ? Math.max(...fees.map((f) => f.annualFees)) : 0;

  const totalClasses = new Set(fees.map((f) => f.className)).size;

  const cards = [
    {
      title: "Total Structures",
      value: fees.length,
      icon: Layers3,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Average Fees",
      value: `₹${avgFees.toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Highest Fees",
      value: `₹${highestFees.toLocaleString()}`,
      icon: IndianRupee,
      color: "bg-purple-100 text-purple-700",
    },
    {
      title: "Classes",
      value: totalClasses,
      icon: School,
      color: "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <div
      className="
        grid
        grid-cols-1
        gap-5
        md:grid-cols-2
        xl:grid-cols-4
      "
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-lg
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{card.title}</p>

                <h2
                  className="
                    mt-2
                    text-3xl
                    font-bold
                    text-slate-900
                  "
                >
                  {card.value}
                </h2>
              </div>

              <div
                className={`
                  rounded-2xl
                  p-4
                  ${card.color}
                `}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
