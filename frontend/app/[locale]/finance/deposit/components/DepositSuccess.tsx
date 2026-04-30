"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { fadeInUp, scaleIn, copyToClipboard } from "./deposit-helpers";
import { toast } from "sonner";

interface DepositSuccessProps {
  deposit: any;
  selectedCurrency: string;
  selectedWalletType: { value: string; label: string } | null;
  onReset: () => void;
}

export function DepositSuccess({
  deposit,
  selectedCurrency,
  selectedWalletType,
  onReset,
}: DepositSuccessProps) {
  const t = useTranslations("common");
  const tExt = useTranslations("ext");
  const tExtAdmin = useTranslations("ext_admin");
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div {...fadeInUp} className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {t("deposit_successful")}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("your_deposit_has_been_added_to_your_account")}
        </p>
      </motion.div>

      <motion.div {...scaleIn}>
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t("deposit_details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{t("amount")}</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {deposit.amount} {deposit.currency?.toUpperCase() || selectedCurrency}
                </span>
              </div>
              {deposit.fee && Number(deposit.fee) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{t("fee")}</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {deposit.fee} {deposit.currency?.toUpperCase() || selectedCurrency}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{t("method")}</span>
                <span className="font-medium">{deposit.method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{t("wallet")}</span>
                <span className="font-medium">{selectedWalletType?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{t("status")}</span>
                <span className={`font-medium ${
                  deposit.status === "COMPLETED" ? "text-green-600 dark:text-green-400" :
                  deposit.status === "PENDING" ? "text-yellow-600 dark:text-yellow-400" :
                  "text-red-600 dark:text-red-400"
                }`}>
                  {deposit.status}
                </span>
              </div>
              {deposit.balance && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{t("new_balance")}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {deposit.balance} {deposit.currency?.toUpperCase() || selectedCurrency}
                  </span>
                </div>
              )}
              {deposit.transactionHash && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{t("transaction_hash")}</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                      {deposit.transactionHash.slice(0, 16)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(deposit.transactionHash, toast)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {deposit.blockNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{tExtAdmin("block_number")}</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {deposit.blockNumber}
                  </span>
                </div>
              )}
              {deposit.from && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{t("from")}</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                      {deposit.from.slice(0, 8)}{deposit.from.slice(-6)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(deposit.from, toast)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {deposit.to && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{t("to")}</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                      {deposit.to.slice(0, 8)}{deposit.to.slice(-6)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(deposit.to, toast)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={onReset} className="flex-1">
                {t("make_another_deposit")}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/finance/wallet")}
                className="flex-1"
              >
                {t("view_wallet")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
