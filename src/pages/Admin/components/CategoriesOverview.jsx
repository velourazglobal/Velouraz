import React from "react";
import { Layers, ChevronRight, Gem } from "lucide-react";

const categories = [
  { name: "Necklaces", group: "Core", count: 18, icon: "💎", accent: "bg-rose-50 border-rose-100", badge: "bg-rose-100 text-rose-700" },
  { name: "Earrings", group: "Adornment", count: 27, icon: "✨", accent: "bg-blue-50 border-blue-100", badge: "bg-blue-100 text-blue-700" },
  { name: "Rings", group: "Accents", count: 15, icon: "💍", accent: "bg-amber-50 border-amber-100", badge: "bg-amber-100 text-amber-700" },
];

const CategoriesOverview = () => (
  <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2.5">
          <span className="p-1.5 bg-[#811331]/10 rounded-lg">
            <Layers size={15} className="text-[#811331]" />
          </span>
          Categories
        </h2>
        <p className="text-base text-slate-400 font-medium mt-1 ml-0.5">
          High-level structure of your jewelry catalog
        </p>
      </div>
      <span className="text-[16px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
        {categories.length} Groups
      </span>
    </div>

    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => (
        <div
          key={cat.name}
          className={`group relative rounded-2xl border ${cat.accent} p-5 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden`}
        >
          {/* Subtle floating accent */}
          <div className="absolute -top-4 -right-4 text-5xl opacity-10 group-hover:opacity-20 transition-opacity select-none">
            {cat.icon}
          </div>

          <div className="flex justify-between items-start mb-4">
            <span className={`text-[16px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${cat.badge}`}>
              {cat.group}
            </span>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-[#811331] transition-colors" />
          </div>

          <div className="text-2xl mb-2">{cat.icon}</div>
          <p className="text-base font-bold text-slate-900">{cat.name}</p>
          <p className="mt-1 text-base font-medium text-slate-500">{cat.count} active products</p>

          {/* Bottom highlight bar */}
          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#811331] group-hover:w-full transition-all duration-500 rounded-b-2xl" />
        </div>
      ))}
    </div>
  </section>
);

export default CategoriesOverview;
