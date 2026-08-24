import { PRODUCT_CONFIG } from "@/lib/product-config";
import { jsonUtf8 } from "@/lib/security/request";

export function presentationsDisabledResponse() {
  if (PRODUCT_CONFIG.features.presentations) return null;

  return jsonUtf8(
    { error: "A criação de apresentações não faz mais parte do Pontuei." },
    { status: 410 }
  );
}
