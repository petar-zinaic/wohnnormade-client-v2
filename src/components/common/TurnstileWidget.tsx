"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaCheck } from "react-icons/fa";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileRenderOptions {
  sitekey: string;
  language?: string;
  theme?: "light" | "dark" | "auto";
  execution?: "render" | "execute";
  appearance?: "always" | "execute" | "interaction-only";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

// Loads the Turnstile script once and shares it across mounts
const loadTurnstile = (): Promise<TurnstileApi> => {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        if (window.turnstile) {
          resolve(window.turnstile);
        } else {
          reject(new Error("Turnstile failed to initialize"));
        }
      };
      script.onerror = () => {
        scriptPromise = null;
        script.remove();
        reject(new Error("Turnstile script failed to load"));
      };
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
};

type CaptchaStatus = "loading" | "idle" | "verifying" | "success" | "error";

export interface TurnstileWidgetHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerify, onExpire, onError }, ref) {
    const { t, i18n } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const callbacksRef = useRef({ onVerify, onExpire, onError });
    callbacksRef.current = { onVerify, onExpire, onError };
    const [status, setStatus] = useState<CaptchaStatus>("loading");

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const language = i18n.language?.startsWith("de") ? "de" : "en";

    const resetWidget = () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
        setStatus("idle");
      }
    };

    useImperativeHandle(ref, () => ({ reset: resetWidget }));

    useEffect(() => {
      if (!siteKey) {
        console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
        setStatus("error");
        return;
      }

      let cancelled = false;
      setStatus("loading");

      loadTurnstile()
        .then((turnstile) => {
          if (cancelled || !containerRef.current) return;
          widgetIdRef.current = turnstile.render(containerRef.current, {
            sitekey: siteKey,
            language,
            theme: "light",
            execution: "execute",
            appearance: "interaction-only",
            callback: (token) => {
              setStatus("success");
              callbacksRef.current.onVerify(token);
            },
            "expired-callback": () => {
              setStatus("idle");
              callbacksRef.current.onExpire?.();
            },
            "error-callback": () => {
              setStatus("error");
              callbacksRef.current.onError?.();
            },
          });
          setStatus("idle");
        })
        .catch(() => {
          if (cancelled) return;
          setStatus("error");
          callbacksRef.current.onError?.();
        });

      return () => {
        cancelled = true;
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
          // A re-render issues a new token, so drop the old one
          callbacksRef.current.onExpire?.();
        }
      };
    }, [siteKey, language]);

    const handleClick = () => {
      if (!window.turnstile || !widgetIdRef.current) return;
      if (status === "idle") {
        setStatus("verifying");
        window.turnstile.execute(widgetIdRef.current);
      } else if (status === "error") {
        window.turnstile.reset(widgetIdRef.current);
        setStatus("verifying");
        window.turnstile.execute(widgetIdRef.current);
      }
    };

    const isClickable = status === "idle" || status === "error";

    const statusText = {
      loading: t("captcha.clickToVerify"),
      idle: t("captcha.clickToVerify"),
      verifying: t("captcha.verifying"),
      success: t("captcha.success"),
      error: t("captcha.retry"),
    }[status];

    return (
      <div>
        <p className="block text-blueDark text-sm font-bold mb-2">
          {t("captcha.notRobot")}
        </p>
        <button
          type="button"
          role="checkbox"
          aria-checked={status === "success"}
          aria-label={t("captcha.notRobot")}
          onClick={handleClick}
          disabled={!isClickable}
          className={`flex items-center justify-between w-full max-w-xs h-16 px-3 border rounded bg-white shadow-sm text-left transition-colors ${
            status === "error" ? "border-red-500" : "border-gray"
          } ${isClickable ? "hover:bg-orangeLight cursor-pointer" : "cursor-default"}`}
        >
          <span className="flex items-center">
            <span className="flex items-center justify-center w-7 h-7 mr-3">
              {status === "success" ? (
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green text-white">
                  <FaCheck size={14} />
                </span>
              ) : status === "verifying" || status === "loading" ? (
                <AiOutlineLoading3Quarters
                  size={22}
                  className="animate-spin text-orange"
                />
              ) : (
                <span className="w-6 h-6 border-2 border-gray rounded-sm bg-white" />
              )}
            </span>
            <span
              className={`text-sm ${
                status === "success"
                  ? "text-green font-semibold"
                  : status === "error"
                  ? "text-red-500"
                  : "text-blueDark"
              }`}
            >
              {statusText}
            </span>
          </span>
          <span className="text-[10px] leading-tight text-gray text-right">
            {t("captcha.protectedBy")}
            <br />
            <span className="font-semibold">Cloudflare</span>
          </span>
        </button>
        {/* Cloudflare shows its own challenge here only when it needs one */}
        <div ref={containerRef} className="mt-2" />
      </div>
    );
  }
);

export default TurnstileWidget;
