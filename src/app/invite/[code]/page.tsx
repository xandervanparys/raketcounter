"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function InviteRedirectPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();

  useEffect(() => {
    if (params?.code) {
      localStorage.setItem("inviteCode", params.code);
      router.replace("/");
    }
  }, [params, router]);

  return <p>Bezig met doorsturen...</p>;
}