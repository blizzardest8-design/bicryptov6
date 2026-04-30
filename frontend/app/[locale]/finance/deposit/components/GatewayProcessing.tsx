"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { fadeInUp } from "./deposit-helpers";

interface GatewayProcessingProps {
  gatewayName?: string | null;
  onCancel: () => void;
  variant?: "stripe" | "gateway";
}

export function GatewayProcessing({
  gatewayName,
  onCancel,
  variant = "gateway",
}: GatewayProcessingProps) {
  const t = useTranslations("common");

  const isStripe = variant === "stripe";
  const displayName = gatewayName
    ? gatewayName.charAt(0).toUpperCase() + gatewayName.slice(1)
    : t("payment");

  const colorClass = isStripe ? "purple" : "blue";

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div {...fadeInUp} className="text-center space-y-8">
        <div className={`mx-auto w-20 h-20 bg-${colorClass}-100 dark:bg-${colorClass}-900/20 rounded-full flex items-center justify-center`}>
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${colorClass}-600`}></div>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {isStripe ? t("processing_stripe_payment") : t("processing_payment")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("please_complete_your_checkout_window")}<br />
            {t("do_not_close_this_page")}
          </p>
        </div>
        <div className={`bg-${colorClass}-50 dark:bg-${colorClass}-950/20 border border-${colorClass}-200 dark:border-${colorClass}-800 rounded-lg p-4`}>
          <p className={`text-sm text-${colorClass}-700 dark:text-${colorClass}-300`}>
            {t("until_the_payment_is_completed")}.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            onCancel();
            toast.info("Payment cancelled");
          }}
          className="mt-4"
        >
          {t("cancel_payment")}
        </Button>
      </motion.div>
    </div>
  );
}
