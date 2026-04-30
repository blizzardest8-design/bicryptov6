"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { fadeInUp } from "./deposit-helpers";

interface DepositErrorProps {
  error: string;
  onRetry: () => void;
  onCancel: () => void;
}

export function DepositError({ error, onRetry, onCancel }: DepositErrorProps) {
  const t = useTranslations("common");

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div {...fadeInUp} className="text-center space-y-8">
        <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {t("deposit_failed")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {t("try_again")}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
