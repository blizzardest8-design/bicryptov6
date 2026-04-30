"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { extractFeeValue } from "./deposit-helpers";

interface ManualDepositFormProps {
  method: any;
  currency: string;
  amount: number;
  onSubmit: (values: any) => Promise<void>;
  loading: boolean;
  onBack: () => void;
}

export function ManualDepositForm({
  method,
  currency,
  amount,
  onSubmit,
  loading,
  onBack,
}: ManualDepositFormProps) {
  const t = useTranslations("common");
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (method.customFields) {
      try {
        const fields = typeof method.customFields === 'string'
          ? JSON.parse(method.customFields)
          : method.customFields;

        const initialValues: Record<string, any> = {};
        fields.forEach((field: any) => {
          if (field.value) initialValues[field.name] = field.value;
        });

        if (Object.keys(initialValues).length > 0) {
          setCustomFields(initialValues);
        }
      } catch (error) {
        console.error("Error parsing custom fields:", error);
      }
    }
  }, [method.customFields]);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!amount || amount <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (method.customFields) {
      try {
        const fields = JSON.parse(method.customFields);
        fields.forEach((field: any) => {
          if (field.required && !customFields[field.name]) {
            const label = field.title || field.label || field.name;
            newErrors[field.name] = `${label} is required`;
          }
        });
      } catch (error) {
        console.error("Error parsing custom fields:", error);
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({ amount, customFields });
    } catch (error) {
      console.error("Error submitting manual deposit:", error);
    }
  };

  const renderCustomField = (field: any) => {
    const value = customFields[field.name] || "";
    const error = errors[field.name];

    const handleChange = (newValue: string) => {
      setCustomFields(prev => ({ ...prev, [field.name]: newValue }));
      if (error) {
        setErrors(prev => {
          const next = { ...prev };
          delete next[field.name];
          return next;
        });
      }
    };

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {field.title || field.label || field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder || field.title || field.label || field.name}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
                error ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              rows={3}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
      case "qr":
        return (
          <div key={field.name} className="space-y-3">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {field.title || field.label || field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {value ? (
              <div className="flex flex-col items-center space-y-3 p-4 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg">
                <img src={value} alt={field.title || "QR Code"} className="w-64 h-64 object-contain" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  {t("scan_this_qr_code_to_complete_your_payment")}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <div className="text-center">
                  <QrCode className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("no_qr_code_available")}</p>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
      default:
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {field.title || field.label || field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              type={field.type || "text"}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder || field.title || field.label || field.name}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
    }
  };

  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
            5
          </span>
          {t("complete_deposit")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{method.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
            {method.description || "Manual transfer method"}
          </p>
          {method.instructions && (
            <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {method.instructions}
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("deposit_amount")}:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{amount} {currency}</span>
          </div>
          {(method.fixedFee || method.percentageFee) && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("fee")}:</span>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {(() => {
                  try {
                    const fixed = extractFeeValue(method.fixedFee, currency);
                    const pct = extractFeeValue(method.percentageFee, currency);
                    return `${fixed} + ${pct}%`;
                  } catch { return "See method details"; }
                })()}
              </span>
            </div>
          )}
        </div>

        {method.customFields && (
          <div className="space-y-4">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{t("additional_information")}</h4>
            {(() => {
              try {
                const fields = JSON.parse(method.customFields);
                return fields.map((field: any) => renderCustomField(field));
              } catch {
                return <p className="text-sm text-red-500">{t("error_loading_form_fields_please_contact_support")}</p>;
              }
            })()}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={loading} className="flex-1">
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                {t('processing')}
              </>
            ) : (
              "Submit Deposit"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
