import type { Metadata } from "next";
import PosApp from "@/components/pos/PosApp";

export const metadata: Metadata = {
  title: "POS เฟรนช์ฟรายส์เขย่า | ชมรมธุรกิจ",
};

export default function PosPage() {
  return <PosApp />;
}
