"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { fadeInUp } from "./deposit-helpers";

interface CurrencySelectorProps {
  currencies: any[];
  selectedCurrency: string;
  onSelect: (currency: string) => void;
}

export function CurrencySelector({
  currencies,
  selectedCurrency,
  onSelect,
}: CurrencySelectorProps) {
  const t = useTranslations("common");
  const tExt = useTranslations("ext");
  const tExtNft = useTranslations("ext_nft");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const filtered = currencies.filter((c: any) => {
    const term = search.toLowerCase();
    return c.value.toLowerCase().includes(term) || c.label.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const startIdx = (page - 1) * perPage;
  const paginated = filtered.slice(startIdx, startIdx + perPage);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <motion.div {...fadeInUp}>
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
              2
            </span>
            {t("select_currency")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder={t("search_currencies")}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {search && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {filtered.length} {tExtNft("results_found")} {tExt("for")}"{search}"
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((currency: any) => (
              <motion.button
                key={currency.value}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(currency.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedCurrency === currency.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-blue-400/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedCurrency === currency.value
                          ? "bg-blue-500 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <span className="text-xs font-bold">
                        {currency.value.slice(0, 2)}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {currency.value}
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {currency.label.split("-")[1] || currency.label}
                      </div>
                    </div>
                  </div>
                  {selectedCurrency === currency.value && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {paginated.length === 0 && search && (
            <div className="text-center py-8">
              <div className="text-zinc-500 dark:text-zinc-400">
                {t("no_currencies_found")} "{search}"
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("showing")} {startIdx + 1}-{Math.min(startIdx + perPage, filtered.length)} {t("of")} {filtered.length}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
