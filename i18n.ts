import { getRequestConfig } from "next-intl/server";
import { getServerLocale } from "@/lib/locale";

export default getRequestConfig(async () => {
  const locale = await getServerLocale();
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
