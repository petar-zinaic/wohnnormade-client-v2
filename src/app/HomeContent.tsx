"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  return (
    <main>
      <div className="container mx-auto p-4 mt-20 font-Montserrat">
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <div className="lg:w-1/2 text-center lg:text-left p-4">
            <h1 className="text-4xl font-bold mb-4">
              {t("home.title")}{" "}
              <span className="text-orange">{t("home.titleSpan")}</span>{" "}
              {t("home.titleSpan2")}
            </h1>
            <p className="mb-6 text-xl text-gray">{t("home.subtitle")}</p>
            {!isAuthenticated && (
              <Link href="/register">
                <Button size="lg" text={t("home.register")} />
              </Link>
            )}
          </div>
          <div className="lg:w-1/2 flex justify-center p-4">
            <Image
              src="/assets/images/home-page-buildings.svg"
              alt="Buildings"
              width={700}
              height={400}
            />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-col lg:flex-row justify-between items-center my-20">
          <div className="lg:w-1/2 flex justify-center p-4">
            <Image
              src="/assets/images/home-page-comunity.svg"
              alt="Tenants"
              width={700}
              height={400}
            />
          </div>
          <div className="lg:w-1/2 text-center lg:text-left p-4">
            <h2 className="text-xl font-bold mb-4 text-orange">
              {t("home.helpTitle")}
            </h2>
            <h3 className="text-4xl font-bold mb-4">
              {t("home.communityTitle")}
            </h3>
            <p className="mb-6 text-xl text-gray">
              {t("home.communitySubtitle")}
            </p>
            <Link href="/contribute">
              <Button size="lg" text={t("home.reportTenant")} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
