"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { GatewayComponentProps } from "./types";
import { REDIRECT_GATEWAY_CONFIGS } from "./types";
import {
  initiateGatewayPayment,
  verifyGatewayPayment,
  formatDepositResult,
  openGatewayPopup,
  monitorPopup,
  extractUrl,
  extractPaymentId,
} from "./gateway-utils";
import { getPaymentGatewayIcon } from "../deposit-helpers";

interface RedirectGatewayProps extends GatewayComponentProps {
  alias: string;
}

export function RedirectGateway({
  alias,
  amount,
  currency,
  method,
  onSuccess,
  onError,
  onCancel,
  onProcessing,
}: RedirectGatewayProps) {
  const t = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const config = REDIRECT_GATEWAY_CONFIGS[alias];

  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  const handlePayment = useCallback(async () => {
    if (!amount || !currency) {
      onError("Missing required deposit information");
      return;
    }

    if (!config) {
      onError(`Unknown gateway: ${alias}`);
      return;
    }

    setLoading(true);

    try {
      const data = await initiateGatewayPayment(alias, amount, currency);

      // Extract redirect URL using config field paths
      // Also check common fallback fields
      const allUrlFields = [
        ...config.urlFields,
        "redirectUrl", "redirect_url", "checkoutUrl", "checkout_url",
        "authorization_url", "payment_url", "formUrl", "url",
        "data.payment_url", "data.checkout_url", "data.authorization_url",
        "data.redirectUrl", "data.formUrl",
      ];
      const redirectUrl = extractUrl(data, allUrlFields);

      if (!redirectUrl) {
        onError(`Invalid ${config.displayName} response - no redirect URL received`);
        setLoading(false);
        return;
      }

      // Extract payment ID for verification
      const allIdFields = [
        ...config.paymentIdFields,
        "sessionId", "session_id", "orderId", "order_id",
        "transactionId", "transaction_id", "paymentId", "payment_id",
        "reference", "id",
        "data.transaction_id", "data.reference", "data.paymentId",
      ];
      const paymentId = extractPaymentId(data, allIdFields);

      // Extract extra verify fields if configured
      const extraParams: Record<string, string> = {};
      if (config.extraVerifyFields) {
        for (const field of config.extraVerifyFields) {
          if (!extraParams[field.verifyParam]) {
            const value = extractPaymentId(data, [field.responseField]);
            if (value) extraParams[field.verifyParam] = value;
          }
        }
      }

      setLoading(false);
      setProcessing(true);
      onProcessing(true);

      const popup = openGatewayPopup(redirectUrl, `${alias}Payment`);

      if (!popup) {
        setProcessing(false);
        onProcessing(false);
        window.location.href = redirectUrl;
        return;
      }

      const cleanup = monitorPopup(popup, async () => {
        if (!paymentId) {
          setProcessing(false);
          onProcessing(false);
          onError("Missing payment reference for verification");
          return;
        }

        try {
          const verifyData = await verifyGatewayPayment(
            alias,
            { [config.verifyParamName]: paymentId, ...extraParams },
            config.verifyMethod || "POST"
          );
          setProcessing(false);
          onProcessing(false);

          if (
            verifyData?.status === "completed" ||
            verifyData?.confirmed ||
            verifyData?.data?.status === "COMPLETED" ||
            verifyData?.success
          ) {
            const result = formatDepositResult(verifyData, config.displayName, amount, currency);
            onSuccess(result);
            toast.success(`${config.displayName} payment completed!`);
          } else {
            onError("Payment was not completed successfully");
          }
        } catch (err: any) {
          setProcessing(false);
          onProcessing(false);
          onError(err.message || `${config.displayName} payment verification failed`);
        }
      });

      cleanupRef.current = () => {
        cleanup();
        setProcessing(false);
        onProcessing(false);
      };
    } catch (err: any) {
      setLoading(false);
      setProcessing(false);
      onProcessing(false);
      onError(err.message || `Failed to initiate ${config?.displayName || alias} payment`);
    }
  }, [alias, amount, currency, config, onSuccess, onError, onCancel, onProcessing]);

  const icon = getPaymentGatewayIcon(alias);
  const buttonTextKey = `pay_with_${alias}`;
  // Try to get translated text, fall back to display name
  const buttonText = t(buttonTextKey as any) !== buttonTextKey
    ? t(buttonTextKey as any)
    : `${t("pay_with")} ${config?.displayName || alias}`;

  return (
    <Button
      onClick={handlePayment}
      disabled={loading || processing}
      className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
      size="lg"
    >
      {loading || processing ? (
        <>
          <Loader size="sm" className="mr-2" />
          {t("processing_payment")}
        </>
      ) : (
        <>
          <span className="mr-2">{icon}</span>
          {buttonText}
          <ChevronRight className="ml-2 h-5 w-5" />
        </>
      )}
    </Button>
  );
}
