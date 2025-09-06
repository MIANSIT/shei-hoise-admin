"use client";

import { DesktopLayout } from "@/app/component/common/AuthDesktop";
// import { MobileLayout } from "../../layout/auth/AuthMobile";
import LoginPage from "@/app/component/auth/Login";

export default function LoginWrapper() {
  return (
    <>
      {/* Desktop Layout */}
      <div className='hidden md:block'>
        <DesktopLayout isAdmin={true}>
          <LoginPage />
        </DesktopLayout>
      </div>
    </>
  );
}
