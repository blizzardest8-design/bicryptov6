"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { fadeInUp, getWalletIcon } from "./deposit-helpers";

interface WalletTypeSelectorProps {
  selectedWalletType: { value: string; label: string } | null;
  onSelect: (wallet: { value: string; label: string }) => void;
  availableWallets: { value: string; label: string }[];
}

export function WalletTypeSelector({
  selectedWalletType,
  onSelect,
  availableWallets,
}: WalletTypeSelectorProps) {
  const t = useTranslations("common");
  const tFinance = useTranslations("finance");

  if (availableWallets.length === 0) {
    return (
      <motion.div {...fadeInUp}>
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
                1
              </span>
              {t("select_wallet_type")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">
                {t("no_wallets_available")}
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                {tFinance("no_wallets_available_description")}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div {...fadeInUp}>
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
              1
            </span>
            {t("select_wallet_type")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableWallets.map((wallet) => {
              const Icon = getWalletIcon(wallet.value);
              return (
                <motion.button
                  key={wallet.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect(wallet)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedWalletType?.value === wallet.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-blue-400/50"
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className={`p-3 rounded-full ${
                        selectedWalletType?.value === wallet.value
                          ? "bg-blue-500 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {wallet.label}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
