import { redirect } from "next/navigation";

export default function SupplierPaymentsRedirect() {
  redirect("/payments?type=SUPPLIER");
}
