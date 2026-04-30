"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useDepositStore } from "@/store/finance/deposit-store";
import { fadeInUp, extractAmountValue } from "./deposit-helpers";
import { ManualDepositForm } from "./ManualDepositForm";
import { GatewayProcessing } from "./GatewayProcessing";

// Gateway components
import {
  StripeGateway,
  PayPalGateway,
  AdyenGateway,
  KlarnaGateway,
  PaytmGateway,
  PayFastGateway,
  PayUGateway,
  IPay88Gateway,
  AuthorizeNetGateway,
  RedirectGateway,
  isRedirectGateway,
} from "./gateways";
import type { DepositResult } from "./gateways";

export function FiatDeposit() {
  const t = useTranslations("common");
  const tExt = useTranslations("ext");

  const {
    step,
    selectedCurrency,
    selectedDepositMethod,
    depositAmount,
    loading,
    deposit,
    setStep,
    setDepositAmount,
    setDeposit,
    setError,
    handleFiatDeposit,
  } = useDepositStore();

  const [gatewayProcessing, setGatewayProcessing] = useState(false);
  const [activeGatewayName, setActiveGatewayName] = useState<string | null>(null);

  // Gateway success handler
  const handleGatewaySuccess = useCallback((result: DepositResult) => {
    setGatewayProcessing(false);
    setActiveGatewayName(null);
    setDeposit(result);
  }, [setDeposit]);

  // Gateway error handler
  const handleGatewayError = useCallback((error: string) => {
    setGatewayProcessing(false);
    setActiveGatewayName(null);
    setError(error);
  }, [setError]);

  // Gateway cancel handler
  const handleGatewayCancel = useCallback(() => {
    setGatewayProcessing(false);
    setActiveGatewayName(null);
  }, []);

  // Gateway processing state handler
  const handleGatewayProcessing = useCallback((active: boolean) => {
    setGatewayProcessing(active);
  }, []);

  // Proceed to manual deposit form (methods without alias)
  const handleProceedToManual = useCallback(() => {
    if (!depositAmount || Number(depositAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setStep(5);
  }, [depositAmount, setStep]);

  // Gateway processing overlay
  if (gatewayProcessing) {
    return (
      <GatewayProcessing
        gatewayName={activeGatewayName}
        variant="gateway"
        onCancel={() => {
          setGatewayProcessing(false);
          setActiveGatewayName(null);
        }}
      />
    );
  }

  // Step 5: Manual deposit form (methods, not gateways)
  if (step === 5 && selectedDepositMethod && !selectedDepositMethod.isGateway) {
    return (
      <AnimatePresence>
        <motion.div {...fadeInUp}>
          <ManualDepositForm
            method={selectedDepositMethod}
            currency={selectedCurrency}
            amount={depositAmount}
            onSubmit={handleFiatDeposit}
            loading={loading}
            onBack={() => setStep(4)}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Step 6: Manual deposit success
  if (step === 6 && deposit) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div {...fadeInUp} className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
            {t("deposit_request_submitted")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("your_deposit_request_has_been_submitted")}
          </p>
        </motion.div>

        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardContent className="space-y-4 pt-6">
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("transaction_id")}:</span>
                <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
                  {deposit.transaction?.id || deposit.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("amount")}:</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {deposit.transaction?.amount || deposit.amount} {deposit.currency || selectedCurrency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("status")}:</span>
                <span className="text-sm px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                  {deposit.transaction?.status || deposit.status || "PENDING"}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{t("next_steps")}:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>{t("our_team_will_review_your_deposit_request")}</li>
                <li>{t("you_will_receive_an_email_confirmation_shortly")}</li>
                <li>{t("processing_typically_takes_1_3_business_days")}</li>
                <li>{t("you_can_track_the_status_in")}</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/finance/history"}
                className="flex-1"
              >
                {tExt("view_transactions")}
              </Button>
              <Button onClick={() => useDepositStore.getState().reset()} className="flex-1">
                {t("make_another_deposit")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 4: Amount input + gateway component
  if (step !== 4 || !selectedDepositMethod) return null;

  const isGateway = selectedDepositMethod.isGateway === true;
  const alias = isGateway ? (selectedDepositMethod.alias?.toLowerCase() || selectedDepositMethod.id?.toLowerCase()) : undefined;
  const minAmount = extractAmountValue(
    selectedDepositMethod.minAmount || selectedDepositMethod.limits?.deposit?.min,
    selectedCurrency
  );
  const isAmountValid = depositAmount > 0 && depositAmount >= minAmount;
  const gatewayProps = {
    amount: depositAmount,
    currency: selectedCurrency,
    method: selectedDepositMethod,
    onSuccess: handleGatewaySuccess,
    onError: handleGatewayError,
    onCancel: handleGatewayCancel,
    onProcessing: handleGatewayProcessing,
  };

  return (
    <AnimatePresence>
      <motion.div {...fadeInUp}>
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
                4
              </span>
              {t("enter_amount")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("deposit_amount")}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount || ""}
                  onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                  min="0"
                  step="0.00000001"
                  className="text-lg pr-16"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {selectedCurrency}
                </div>
              </div>
              {(selectedDepositMethod.minAmount ||
                selectedDepositMethod.limits?.deposit?.min) && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {tExt("minimum")} {extractAmountValue(
                    selectedDepositMethod.minAmount ||
                    selectedDepositMethod.limits?.deposit?.min,
                    selectedCurrency
                  )} {selectedCurrency}
                </p>
              )}
            </div>

            {/* Gateway-specific payment component — only render when amount is valid */}
            <div className="max-w-md mx-auto">
              {isAmountValid
                ? renderGateway(alias, gatewayProps, handleProceedToManual)
                : null}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Render the appropriate gateway component based on the alias
 */
function renderGateway(
  alias: string | undefined,
  props: any,
  onManualProceed: () => void
) {
  if (!alias) {
    // No alias = manual deposit method
    return (
      <Button
        onClick={onManualProceed}
        className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
      >
        Continue
      </Button>
    );
  }

  switch (alias) {
    case "stripe":
      return <StripeGateway {...props} />;
    case "paypal":
      return <PayPalGateway {...props} />;
    case "adyen":
      return <AdyenGateway {...props} />;
    case "klarna":
      return <KlarnaGateway {...props} />;
    case "paytm":
      return <PaytmGateway {...props} />;
    case "payfast":
      return <PayFastGateway {...props} />;
    case "payu":
      return <PayUGateway {...props} />;
    case "ipay88":
      return <IPay88Gateway {...props} />;
    case "authorizenet":
      return <AuthorizeNetGateway {...props} />;
    default:
      // Check if it's a known redirect gateway
      if (isRedirectGateway(alias)) {
        return <RedirectGateway alias={alias} {...props} />;
      }
      // Unknown gateway - try generic redirect as fallback
      return <RedirectGateway alias={alias} {...props} />;
  }
}
